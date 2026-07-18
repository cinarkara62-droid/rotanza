// Thin server-side client for OpenStreetMap's free, keyless public services:
// Nominatim (geocoding/search) and Overpass (POI queries). Both are free and
// require no account, but Nominatim's usage policy asks for a descriptive
// User-Agent and a soft cap of ~1 request/second — the in-memory cache below
// keeps repeat lookups from ever leaving this process.
const USER_AGENT = "Rotanza-Demo/1.0 (+https://rotanza.example; contact: support@rotanza.example)";

interface CacheEntry {
  expires: number;
  data?: unknown;
  failed?: boolean;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const FAILURE_CACHE_TTL_MS = 1000 * 15; // 15 seconds — long enough to stop a burst of retries
// from making a transient blip worse, short enough that a real user isn't locked out for minutes.

// Failures are cached too (briefly) — when Overpass is degraded or rate-
// limiting us, this stops every repeated request for the same city from
// hammering it again and making the underlying outage worse.
async function cachedFetch<T>(key: string, run: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    if (hit.failed) throw new Error("Cached failure — Overpass was unavailable moments ago");
    return hit.data as T;
  }
  try {
    const data = await run();
    cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data });
    return data;
  } catch (err) {
    cache.set(key, { expires: Date.now() + FAILURE_CACHE_TTL_MS, failed: true });
    throw err;
  }
}

export interface GeocodeResult {
  osmId: number;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  boundingBox: [number, number, number, number]; // south, north, west, east
}

export async function geocodeSearch(query: string, limit = 6): Promise<GeocodeResult[]> {
  const key = `geocode:${query.toLowerCase()}:${limit}`;
  return cachedFetch(key, async () => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "0");
    url.searchParams.set("limit", String(limit));
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
    if (!res.ok) throw new Error(`Nominatim search failed: ${res.status}`);
    const raw = (await res.json()) as Array<{
      osm_id: number;
      display_name: string;
      name?: string;
      lat: string;
      lon: string;
      boundingbox: [string, string, string, string];
      type: string;
      class: string;
    }>;
    return raw.map((r) => ({
      osmId: r.osm_id,
      name: r.name || r.display_name.split(",")[0],
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      boundingBox: r.boundingbox.map(Number) as [number, number, number, number],
    }));
  });
}

export interface OsmPlace {
  osmId: number;
  name: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface RawOverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  members?: Array<{ type: string; ref: number; role: string }>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Overpass is fair-use shared infrastructure with several independent public
// mirrors. Relying on a single one (overpass-api.de) means its outages or
// regional slowness directly become our outages — for less-popular cities
// worldwide this was the single biggest cause of empty results. Trying each
// mirror in turn (own timeout each) before giving up spreads that risk out.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

// The public Overpass instances are shared fair-use infrastructure — heavier
// queries (many OR'd filters, like findAttractionsNear's) can legitimately
// take 15-20s to answer even when the mirror is healthy. Splitting the
// budget into small fixed chunks per mirror (an earlier version of this
// function used a flat 12s first attempt) starves exactly those heavy
// queries of the time they need and turns a slow-but-working query into a
// hard failure — so instead, each mirror gets a fair *share* of whatever
// budget remains (at least 9s if the budget allows it at all), and a mirror
// is only abandoned early on a fast rejection (429/406/other non-2xx), not
// cut off mid-flight. Vercel kills serverless functions after ~30s (every
// route calling this sets maxDuration=30) — the per-mirror share shrinks as
// budget is consumed, so the whole loop still respects that ceiling.
async function queryOverpassRaw(query: string, totalBudgetMs = 26000): Promise<RawOverpassElement[]> {
  const deadline = Date.now() + totalBudgetMs;
  let lastErr: unknown;

  for (let i = 0; i < OVERPASS_ENDPOINTS.length; i++) {
    const endpoint = OVERPASS_ENDPOINTS[i];
    const remaining = deadline - Date.now();
    const mirrorsLeft = OVERPASS_ENDPOINTS.length - i;
    if (remaining < 5000) break; // not enough budget left to give another mirror a fair chance

    const attemptTimeout = Math.min(Math.max(remaining / mirrorsLeft, 9000), remaining);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), attemptTimeout);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "*/*",
          "User-Agent": USER_AGENT,
        },
        body: "data=" + encodeURIComponent(query),
        signal: controller.signal,
      });
      // 429/406 are near-instant rejections worth one quick retry against
      // the same mirror before moving on. A 504 means Overpass itself gave
      // up after already taking a long time — move straight to the next
      // mirror rather than retrying the same overloaded one.
      if (res.status === 429 || res.status === 406) {
        await sleep(1000);
        const retryRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "*/*", "User-Agent": USER_AGENT },
          body: "data=" + encodeURIComponent(query),
          signal: controller.signal,
        });
        if (!retryRes.ok) {
          lastErr = new Error(`Overpass busy: ${retryRes.status}`);
          continue;
        }
        const data = (await retryRes.json()) as { elements: RawOverpassElement[] };
        return data.elements;
      }
      if (!res.ok) {
        lastErr = new Error(`Overpass query failed: ${res.status}`);
        continue;
      }
      const data = (await res.json()) as { elements: RawOverpassElement[] };
      return data.elements;
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All Overpass mirrors failed");
}

async function queryOverpass(
  query: string,
  budgetMs?: number
): Promise<Array<{ id: number; lat: number; lon: number; tags?: Record<string, string> }>> {
  const elements = await queryOverpassRaw(query, budgetMs);
  return elements.filter((el): el is RawOverpassElement & { lat: number; lon: number } => el.lat != null && el.lon != null);
}

export interface TransitLine {
  ref: string;
  name: string;
  color: string | null;
  stations: Array<{ name: string; lat: number; lon: number }>;
}

// Live lookup for arbitrary (non-curated) cities. Relation queries are much
// heavier than simple node queries, so this uses a short timeout and a
// smaller radius — some valid cities may still time out or have no transit
// relations mapped in OSM; callers should treat an empty result as "not
// available" rather than an error.
export async function findTransitLinesNear(lat: number, lon: number, radiusMeters = 8000): Promise<TransitLine[]> {
  const key = `transit:${lat.toFixed(2)}:${lon.toFixed(2)}:${radiusMeters}`;
  return cachedFetch(key, async () => {
    const query = `[out:json][timeout:22];
(
  relation["route"="subway"]["name"](around:${radiusMeters},${lat},${lon});
  relation["route"="light_rail"]["name"](around:${radiusMeters},${lat},${lon});
);
out body 20;
>;
out body qt;`;
    const elements = await queryOverpassRaw(query);

    const nodeById = new Map<number, RawOverpassElement>();
    const relations: RawOverpassElement[] = [];
    for (const el of elements) {
      if (el.type === "node") nodeById.set(el.id, el);
      else if (el.type === "relation") relations.push(el);
    }

    const lines: TransitLine[] = [];
    for (const rel of relations) {
      const seen = new Set<string>();
      const stations: TransitLine["stations"] = [];
      for (const member of rel.members ?? []) {
        if (member.type !== "node" || !member.role?.startsWith("stop")) continue;
        const node = nodeById.get(member.ref);
        if (!node?.tags?.name || node.lat == null || node.lon == null) continue;
        if (seen.has(node.tags.name)) continue;
        seen.add(node.tags.name);
        stations.push({ name: node.tags.name, lat: node.lat, lon: node.lon });
      }
      if (stations.length < 2 || !rel.tags) continue;
      lines.push({
        ref: rel.tags.ref || rel.tags.name || "?",
        name: rel.tags.name || rel.tags.ref || "",
        color: rel.tags.colour ?? null,
        stations,
      });
    }

    // OSM often models each direction of a line as a separate relation —
    // keep only the most complete (most-stations) one per ref. Semicolon-
    // joined refs (e.g. "DT;Z") are through-running services, not real
    // distinct line names, so they're dropped in favor of the base lines.
    const best = new Map<string, TransitLine>();
    for (const line of lines) {
      if (line.ref.includes(";")) continue;
      const existing = best.get(line.ref);
      if (!existing || line.stations.length > existing.stations.length) best.set(line.ref, line);
    }
    return [...best.values()];
  });
}

// One filter per query, run in parallel — a single compound query OR-ing
// all of these together (the previous approach) measured 20s+ even on a
// healthy mirror, apparently because the value-less `historic` filter
// forces a much more expensive scan; findPlacesNear's single-filter queries
// consistently answer in 1-2s, so splitting into that same shape (and
// merging the results) is both faster overall and far more resilient —
// a slow/failing filter no longer blocks every other category.
const ATTRACTION_FILTERS = [
  '["tourism"="museum"]',
  '["tourism"="gallery"]',
  '["tourism"="attraction"]',
  '["tourism"="viewpoint"]',
  '["historic"]',
  '["leisure"="park"]',
  '["natural"="beach"]',
  '["amenity"="bar"]',
  '["amenity"="pub"]',
  '["amenity"="nightclub"]',
  '["shop"="mall"]',
  '["amenity"="marketplace"]',
];

async function findAttractionsAtRadius(lat: number, lon: number, radiusMeters: number, limit: number, budgetMs: number): Promise<OsmPlace[]> {
  const around = `around:${radiusMeters},${lat},${lon}`;
  const perFilterBudget = Math.max(budgetMs, 9000);
  const settled = await Promise.allSettled(
    ATTRACTION_FILTERS.map((filter) => {
      const query = `[out:json][timeout:15];node${filter}["name"](${around});out body ${Math.ceil(limit / 3)};`;
      return queryOverpass(query, perFilterBudget);
    })
  );
  const byId = new Map<number, OsmPlace>();
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const el of result.value) {
      if (!el.tags?.name || byId.has(el.id)) continue;
      byId.set(el.id, { osmId: el.id, name: el.tags.name, lat: el.lat, lon: el.lon, tags: el.tags });
    }
  }
  return [...byId.values()].slice(0, limit);
}

// A city's geocoded centroid (from Nominatim) doesn't always sit near where
// OSM contributors have actually tagged points of interest — this is
// especially common for less-mapped towns and cities with sprawling admin
// boundaries. Rather than give up on the first empty result, widen the
// search ring before concluding "nothing here" — each radius is cached
// under its own key so a later request for the same city doesn't redo it.
export async function findAttractionsNear(
  lat: number,
  lon: number,
  radiusMeters = 2200,
  limit = 40
): Promise<OsmPlace[]> {
  const radii = [radiusMeters, radiusMeters * 4];
  const deadline = Date.now() + 27000; // shared across both radii, just under maxDuration=30 and the client's 29s timeout
  for (const r of radii) {
    const key = `attractions:${lat.toFixed(3)}:${lon.toFixed(3)}:${r}`;
    const remaining = deadline - Date.now();
    if (remaining < 9000) break;
    const results = await cachedFetch(key, () => findAttractionsAtRadius(lat, lon, r, limit, remaining));
    if (results.length > 0 || r === radii[radii.length - 1]) return results;
  }
  return [];
}

const PLACE_FILTERS: Record<"restaurant" | "hotel" | "viewpoint", string> = {
  restaurant: '["amenity"="restaurant"]',
  hotel: '["tourism"="hotel"]',
  viewpoint: '["tourism"="viewpoint"]',
};

// Same widening-ring strategy as findAttractionsNear: a city center point
// with zero restaurants/hotels within the default radius is very often just
// a mismatch between where Nominatim placed the centroid and where OSM
// contributors mapped the amenity — not genuine absence — so we try wider
// rings before reporting nothing.
export async function findPlacesNear(
  lat: number,
  lon: number,
  kind: "restaurant" | "hotel" | "viewpoint",
  radiusMeters = 2500,
  limit = 30
): Promise<OsmPlace[]> {
  const filter = PLACE_FILTERS[kind];
  const radii = [radiusMeters, radiusMeters * 3, radiusMeters * 8];
  const deadline = Date.now() + 23000;
  for (const r of radii) {
    const key = `places:${kind}:${lat.toFixed(3)}:${lon.toFixed(3)}:${r}`;
    const remaining = deadline - Date.now();
    if (remaining < 3000) break;
    const results = await cachedFetch(key, async () => {
      const query = `[out:json][timeout:22];node${filter}["name"](around:${r},${lat},${lon});out body ${limit};`;
      const elements = await queryOverpass(query, remaining);
      return elements
        .filter((el) => el.tags?.name)
        .map((el) => ({ osmId: el.id, name: el.tags!.name, lat: el.lat, lon: el.lon, tags: el.tags! }));
    });
    if (results.length > 0 || r === radii[radii.length - 1]) return results;
  }
  return [];
}

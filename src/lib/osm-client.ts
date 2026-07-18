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

// A brief, painful detour: this used to fan out across 3 public Overpass
// mirrors and/or split one query into many parallel single-filter queries,
// hoping to dodge slow/degraded mirrors. In production that made things
// worse — firing many concurrent requests at Overpass's shared
// infrastructure got the whole batch rate-limited (429) far more often
// than a single sequential request ever did, silently producing empty
// results. Back to one endpoint, one request at a time, with a genuinely
// generous timeout on the first attempt (this is what "give slow Overpass
// queries a real chance to finish" originally meant) and a single short
// retry only for the near-instant 429/406 rejections.
const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

async function queryOverpassRaw(query: string, totalBudgetMs = 26000): Promise<RawOverpassElement[]> {
  const deadline = Date.now() + totalBudgetMs;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const attemptTimeout = Math.min(attempt === 1 ? totalBudgetMs - 4000 : 4000, deadline - Date.now());
    if (attemptTimeout < 2000) break;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), attemptTimeout);
    try {
      const res = await fetch(OVERPASS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "*/*",
          "User-Agent": USER_AGENT,
        },
        body: "data=" + encodeURIComponent(query),
        signal: controller.signal,
      });
      if (res.status === 429 || res.status === 406) {
        if (attempt === 1) {
          await sleep(1500);
          continue;
        }
        throw new Error(`Overpass busy: ${res.status}`);
      }
      if (!res.ok) throw new Error(`Overpass query failed: ${res.status}`);
      const data = (await res.json()) as { elements: RawOverpassElement[] };
      return data.elements;
    } catch (err) {
      if (attempt === 2) throw err;
      if (err instanceof Error && err.name === "AbortError") throw err; // our own timeout — no point retrying short
      await sleep(1500);
    } finally {
      clearTimeout(timer);
    }
  }
  return [];
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

// findPlacesNear's single-filter queries reliably answer in 1-2s; a single
// query OR-ing 12 filters together (the original shape) measures as
// "server too busy" on Overpass itself even for a data-rich city like
// Paris — confirmed by querying Overpass directly. So this runs the same
// filters as separate lightweight queries like findPlacesNear does, but
// strictly one at a time (not in parallel — a burst of concurrent requests
// is what triggered real rate-limiting from Overpass in an earlier version
// of this function). A generous shared deadline across the whole loop
// means one slow category doesn't necessarily sink the rest — whatever
// completes in time gets returned, and a per-category failure/timeout is
// skipped rather than aborting everything.
const ATTRACTION_FILTERS = [
  '["tourism"="museum"]',
  '["tourism"="gallery"]',
  '["tourism"="attraction"]',
  '["historic"]',
  '["leisure"="park"]',
  '["natural"="beach"]',
  '["amenity"="bar"]',
  '["amenity"="nightclub"]',
  '["shop"="mall"]',
  '["amenity"="marketplace"]',
];

async function findAttractionsAtRadius(lat: number, lon: number, radiusMeters: number, limit: number, deadline: number): Promise<OsmPlace[]> {
  const around = `around:${radiusMeters},${lat},${lon}`;
  const byId = new Map<number, OsmPlace>();
  for (const filter of ATTRACTION_FILTERS) {
    const remaining = deadline - Date.now();
    if (remaining < 3000) break;
    try {
      const query = `[out:json][timeout:8];node${filter}["name"](${around});out body ${Math.ceil(limit / 2)};`;
      const elements = await queryOverpass(query, Math.min(remaining, 9000));
      for (const el of elements) {
        if (!el.tags?.name || byId.has(el.id)) continue;
        byId.set(el.id, { osmId: el.id, name: el.tags.name, lat: el.lat, lon: el.lon, tags: el.tags });
      }
    } catch {
      // one category failing/timing out shouldn't sink the others
    }
  }
  return [...byId.values()].slice(0, limit);
}

// A city's geocoded centroid (from Nominatim) doesn't always sit near where
// OSM contributors have actually tagged points of interest — this is
// especially common for less-mapped towns and cities with sprawling admin
// boundaries. Rather than give up on the first empty result, widen the
// search ring once before concluding "nothing here" — each radius is
// cached under its own key so a later request for the same city doesn't
// redo the widening.
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
    if (remaining < 6000) break;
    const results = await cachedFetch(key, () => findAttractionsAtRadius(lat, lon, r, limit, deadline));
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

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

// The public Overpass instance is shared fair-use infrastructure — under
// load it can take well over 10s to answer even a simple query, so the
// *first* attempt gets a generous budget rather than failing fast. A 429/406
// (instant rejection, not genuine slowness) still gets one quick retry.
// Vercel kills serverless functions after ~30s (we set maxDuration=30 on
// every route that calls this), so the longest possible path here — one
// long attempt, or a fast rejection plus one short retry — stays safely
// under that ceiling either way.
async function queryOverpassRaw(query: string, timeoutMs = 24000): Promise<RawOverpassElement[]> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const attemptTimeout = attempt === 1 ? timeoutMs : 8000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), attemptTimeout);
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "*/*",
          "User-Agent": USER_AGENT,
        },
        body: "data=" + encodeURIComponent(query),
        signal: controller.signal,
      });
      // 429/406 are near-instant rejections worth one quick retry. A 504
      // means Overpass itself timed out after already taking a long time —
      // retrying with a short budget won't help, so that's treated as final.
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

async function queryOverpass(query: string): Promise<Array<{ id: number; lat: number; lon: number; tags?: Record<string, string> }>> {
  const elements = await queryOverpassRaw(query);
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

export async function findAttractionsNear(
  lat: number,
  lon: number,
  radiusMeters = 2200,
  limit = 40
): Promise<OsmPlace[]> {
  const key = `attractions:${lat.toFixed(3)}:${lon.toFixed(3)}:${radiusMeters}`;
  return cachedFetch(key, async () => {
    const around = `around:${radiusMeters},${lat},${lon}`;
    const query = `[out:json][timeout:22];
(
  node["tourism"="museum"]["name"](${around});
  node["tourism"="gallery"]["name"](${around});
  node["tourism"="attraction"]["name"](${around});
  node["tourism"="viewpoint"]["name"](${around});
  node["historic"]["name"](${around});
  node["leisure"="park"]["name"](${around});
  node["natural"="beach"]["name"](${around});
  node["amenity"="bar"]["name"](${around});
  node["amenity"="pub"]["name"](${around});
  node["amenity"="nightclub"]["name"](${around});
  node["shop"="mall"]["name"](${around});
  node["amenity"="marketplace"]["name"](${around});
);
out body ${limit};`;
    const elements = await queryOverpass(query);
    return elements
      .filter((el) => el.tags?.name)
      .map((el) => ({ osmId: el.id, name: el.tags!.name, lat: el.lat, lon: el.lon, tags: el.tags! }));
  });
}

export async function findPlacesNear(
  lat: number,
  lon: number,
  kind: "restaurant" | "hotel",
  radiusMeters = 2500,
  limit = 30
): Promise<OsmPlace[]> {
  const key = `places:${kind}:${lat.toFixed(3)}:${lon.toFixed(3)}:${radiusMeters}`;
  return cachedFetch(key, async () => {
    const filter = kind === "restaurant" ? '["amenity"="restaurant"]' : '["tourism"="hotel"]';
    const query = `[out:json][timeout:22];node${filter}["name"](around:${radiusMeters},${lat},${lon});out body ${limit};`;
    const elements = await queryOverpass(query);
    return elements
      .filter((el) => el.tags?.name)
      .map((el) => ({ osmId: el.id, name: el.tags!.name, lat: el.lat, lon: el.lon, tags: el.tags! }));
  });
}

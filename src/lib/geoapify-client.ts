// Geoapify Places API — a paid but much cheaper (and far more reliable)
// alternative to the free, shared Overpass instance used elsewhere in this
// file's sibling, osm-client.ts. Same underlying OpenStreetMap data (so the
// same small-town coverage gaps can still apply), but served from
// Geoapify's own dedicated, cached infrastructure instead of a community
// server that can be arbitrarily slow or rate-limited.
//
// Geoapify passes the source OSM tags straight through in
// `properties.datasource.raw` for OSM-derived places, so this returns the
// exact same OsmPlace shape osm-client.ts does — every existing
// categorization/cuisine/emoji helper (attraction-map.ts, cuisine-map.ts)
// works unchanged regardless of which backend actually answered the query.
import type { OsmPlace } from "@/lib/osm-client";

interface GeoapifyFeature {
  properties: {
    place_id: string;
    name?: string;
    lat: number;
    lon: number;
    datasource?: { raw?: Record<string, string> };
  };
}

// Places API ids are opaque strings, not numbers — this app's OsmPlace type
// (and everything downstream keying off `osmId`) expects a number, so this
// derives a stable one from the string rather than widening that type.
function hashId(placeId: string): number {
  let h = 0;
  for (let i = 0; i < placeId.length; i++) h = (h * 31 + placeId.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function isGeoapifyConfigured(): boolean {
  return !!process.env.GEOAPIFY_API_KEY;
}

async function queryGeoapifyPlaces(
  categories: string,
  lat: number,
  lon: number,
  radiusMeters: number,
  limit: number
): Promise<OsmPlace[]> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error("GEOAPIFY_API_KEY is not set");

  const url = new URL("https://api.geoapify.com/v2/places");
  url.searchParams.set("categories", categories);
  url.searchParams.set("filter", `circle:${lon},${lat},${radiusMeters}`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("apiKey", apiKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Geoapify request failed: ${res.status}`);
    const data = (await res.json()) as { features: GeoapifyFeature[] };
    return data.features
      .filter((f) => f.properties.name)
      .map((f) => ({
        osmId: hashId(f.properties.place_id),
        name: f.properties.name!,
        lat: f.properties.lat,
        lon: f.properties.lon,
        tags: f.properties.datasource?.raw ?? {},
      }));
  } finally {
    clearTimeout(timer);
  }
}

// Mirrors osm-client.ts's findAttractionsNear filter set (museum, general
// attractions, historic sites, parks, malls) via Geoapify's own category
// taxonomy.
export async function findAttractionsGeoapify(
  lat: number,
  lon: number,
  radiusMeters = 2200,
  limit = 40
): Promise<OsmPlace[]> {
  const categories = [
    "tourism.sights",
    "entertainment.museum",
    "entertainment.culture",
    "leisure.park",
    "commercial.shopping_mall",
  ].join(",");
  return queryGeoapifyPlaces(categories, lat, lon, radiusMeters, limit);
}

const PLACE_CATEGORIES: Record<"restaurant" | "hotel" | "viewpoint", string> = {
  restaurant: "catering.restaurant",
  hotel: "accommodation.hotel",
  viewpoint: "tourism.sights.view_point",
};

export async function findPlacesGeoapify(
  lat: number,
  lon: number,
  kind: "restaurant" | "hotel" | "viewpoint",
  radiusMeters = 2500,
  limit = 30
): Promise<OsmPlace[]> {
  return queryGeoapifyPlaces(PLACE_CATEGORIES[kind], lat, lon, radiusMeters, limit);
}

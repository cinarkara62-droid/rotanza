// One-off data-generation script: pulls real restaurant & hotel names/locations
// from OpenStreetMap (Overpass API, free, no key required) for each supported city
// and writes static JSON snapshots into src/lib/mock-data/generated/.
// Re-run manually with `node scripts/fetch-osm-data.mjs` if you want fresher data —
// the app itself never calls Overpass at runtime (keeps it free and fast).
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const CITIES = [
  { id: "istanbul", bbox: [41.0, 28.94, 41.05, 29.02] },
  { id: "paris", bbox: [48.83, 2.25, 48.9, 2.4] },
  { id: "rome", bbox: [41.88, 12.45, 41.92, 12.52] },
  { id: "tokyo", bbox: [35.65, 139.68, 35.72, 139.78] },
  { id: "barcelona", bbox: [41.37, 2.14, 41.4, 2.19] },
  { id: "london", bbox: [51.49, -0.16, 51.53, -0.08] },
  { id: "newyork", bbox: [40.7, -74.02, 40.78, -73.96] },
  { id: "amsterdam", bbox: [52.36, 4.87, 52.39, 4.92] },
];

function buildQuery([s, w, n, e]) {
  return `[out:json][timeout:40];
(
  node["amenity"="restaurant"]["name"](${s},${w},${n},${e});
);
out body 60;
(
  node["tourism"="hotel"]["name"](${s},${w},${n},${e});
);
out body 40;`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryOverpass(query, attempt = 1) {
  const endpoint = OVERPASS_ENDPOINTS[(attempt - 1) % OVERPASS_ENDPOINTS.length];
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "*/*",
      "User-Agent": "rotanza-data-script/1.0 (contact: local-dev)",
    },
    body: "data=" + encodeURIComponent(query),
  });
  if (res.status === 429 || res.status === 504) {
    if (attempt > 5) throw new Error(`Gave up after ${attempt} attempts (status ${res.status})`);
    const wait = attempt * 8000;
    console.log(`  status ${res.status}, retrying in ${wait / 1000}s...`);
    await sleep(wait);
    return queryOverpass(query, attempt + 1);
  }
  if (!res.ok) throw new Error(`Overpass error ${res.status}: ${await res.text()}`);
  return res.json();
}

function splitElements(elements) {
  // We issued two `out` statements in one query, but Overpass merges results
  // into a single elements array tagged by their original OSM `tags`.
  const restaurants = [];
  const hotels = [];
  for (const el of elements) {
    if (!el.tags?.name) continue;
    if (el.tags.amenity === "restaurant") restaurants.push(el);
    else if (el.tags.tourism === "hotel") hotels.push(el);
  }
  return { restaurants, hotels };
}

async function main() {
  const outDir = path.join(process.cwd(), "src/lib/mock-data/generated");
  await mkdir(outDir, { recursive: true });

  const allRestaurants = {};
  const allHotels = {};

  for (const city of CITIES) {
    console.log(`Fetching ${city.id}...`);
    try {
      const data = await queryOverpass(buildQuery(city.bbox));
      const { restaurants, hotels } = splitElements(data.elements ?? []);
      allRestaurants[city.id] = restaurants.map((el) => ({
        osmId: el.id,
        name: el.tags.name,
        cuisine: el.tags.cuisine ?? null,
        lat: el.lat,
        lon: el.lon,
        street: el.tags["addr:street"] ?? null,
        housenumber: el.tags["addr:housenumber"] ?? null,
        website: el.tags.website ?? el.tags["contact:website"] ?? null,
      }));
      allHotels[city.id] = hotels.map((el) => ({
        osmId: el.id,
        name: el.tags.name,
        stars: el.tags.stars ?? null,
        lat: el.lat,
        lon: el.lon,
        street: el.tags["addr:street"] ?? null,
        housenumber: el.tags["addr:housenumber"] ?? null,
        website: el.tags.website ?? el.tags["contact:website"] ?? null,
      }));
      console.log(`  -> ${allRestaurants[city.id].length} restaurants, ${allHotels[city.id].length} hotels`);
    } catch (err) {
      console.error(`  FAILED for ${city.id}:`, err.message);
      allRestaurants[city.id] = [];
      allHotels[city.id] = [];
    }
    await sleep(4000);
  }

  await writeFile(path.join(outDir, "restaurants.json"), JSON.stringify(allRestaurants, null, 2));
  await writeFile(path.join(outDir, "hotels.json"), JSON.stringify(allHotels, null, 2));
  console.log("Done. Wrote src/lib/mock-data/generated/{restaurants,hotels}.json");
}

main();

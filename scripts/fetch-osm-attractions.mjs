// Fetches real, categorized points of interest (museums, historic sites,
// parks, nightlife, shopping...) per city from OpenStreetMap/Overpass, free
// and keyless. Writes src/lib/mock-data/generated/attractions.json.
// Re-run manually with `node scripts/fetch-osm-attractions.mjs`.
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
  const bbox = `${s},${w},${n},${e}`;
  return `[out:json][timeout:50];
(
  node["tourism"="museum"]["name"](${bbox});
  node["tourism"="gallery"]["name"](${bbox});
  node["tourism"="attraction"]["name"](${bbox});
  node["tourism"="viewpoint"]["name"](${bbox});
  node["historic"]["name"](${bbox});
  node["leisure"="park"]["name"](${bbox});
  node["natural"="beach"]["name"](${bbox});
  node["amenity"="bar"]["name"](${bbox});
  node["amenity"="pub"]["name"](${bbox});
  node["amenity"="nightclub"]["name"](${bbox});
  node["shop"="mall"]["name"](${bbox});
  node["amenity"="marketplace"]["name"](${bbox});
);
out body 150;`;
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

// Maps raw OSM tags to our app's interest categories.
function categorize(tags) {
  const cats = new Set();
  if (tags.tourism === "museum") {
    cats.add("art");
    cats.add("history");
  }
  if (tags.tourism === "gallery") cats.add("art");
  if (tags.tourism === "attraction" || tags.tourism === "viewpoint") cats.add("nature");
  if (tags.historic) cats.add("history");
  if (tags.leisure === "park" || tags.natural === "beach") cats.add("nature");
  if (["bar", "pub", "nightclub"].includes(tags.amenity)) cats.add("nightlife");
  if (tags.shop === "mall" || tags.amenity === "marketplace") cats.add("shopping");
  return [...cats];
}

function emojiFor(tags) {
  if (tags.tourism === "museum") return "🏛️";
  if (tags.tourism === "gallery") return "🎨";
  if (tags.tourism === "viewpoint") return "🌇";
  if (tags.historic) return "🏺";
  if (tags.leisure === "park") return "🌳";
  if (tags.natural === "beach") return "🏖️";
  if (tags.amenity === "bar" || tags.amenity === "pub") return "🍻";
  if (tags.amenity === "nightclub") return "🎶";
  if (tags.shop === "mall" || tags.amenity === "marketplace") return "🛍️";
  return "📍";
}

async function main() {
  const outDir = path.join(process.cwd(), "src/lib/mock-data/generated");
  await mkdir(outDir, { recursive: true });

  const all = {};

  for (const city of CITIES) {
    console.log(`Fetching attractions for ${city.id}...`);
    try {
      const data = await queryOverpass(buildQuery(city.bbox));
      const seen = new Set();
      const items = [];
      for (const el of data.elements ?? []) {
        if (!el.tags?.name || seen.has(el.id)) continue;
        seen.add(el.id);
        const categories = categorize(el.tags);
        if (categories.length === 0) continue;
        items.push({
          osmId: el.id,
          name: el.tags.name,
          lat: el.lat,
          lon: el.lon,
          categories,
          emoji: emojiFor(el.tags),
        });
      }
      all[city.id] = items;
      console.log(`  -> ${items.length} categorized attractions`);
    } catch (err) {
      console.error(`  FAILED for ${city.id}:`, err.message);
      all[city.id] = [];
    }
    await sleep(4000);
  }

  await writeFile(path.join(outDir, "attractions.json"), JSON.stringify(all, null, 2));
  console.log("Done. Wrote src/lib/mock-data/generated/attractions.json");
}

main();

// Fetches REAL, complete metro/subway/light-rail line geometries (ordered
// stations with coordinates) from OpenStreetMap public-transport relations,
// free and keyless. Writes src/lib/mock-data/generated/metro.json.
// Re-run manually with `node scripts/fetch-osm-metro.mjs`.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const CITIES = [
  { id: "istanbul", bbox: [40.85, 28.6, 41.25, 29.4] },
  { id: "paris", bbox: [48.78, 2.15, 48.95, 2.5] },
  { id: "rome", bbox: [41.78, 12.35, 41.98, 12.65] },
  { id: "tokyo", bbox: [35.55, 139.55, 35.85, 139.9] },
  { id: "barcelona", bbox: [41.32, 2.02, 41.48, 2.25] },
  { id: "london", bbox: [51.36, -0.35, 51.65, 0.15] },
  { id: "newyork", bbox: [40.55, -74.15, 40.9, -73.7] },
  { id: "amsterdam", bbox: [52.28, 4.75, 52.43, 5.02] },
];

function buildQuery([s, w, n, e]) {
  const bbox = `${s},${w},${n},${e}`;
  return `[out:json][timeout:120];
(
  relation["route"="subway"]["name"](${bbox});
  relation["route"="light_rail"]["name"](${bbox});
);
out body;
>;
out body qt;`;
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
    const wait = attempt * 10000;
    console.log(`  status ${res.status}, retrying in ${wait / 1000}s...`);
    await sleep(wait);
    return queryOverpass(query, attempt + 1);
  }
  if (!res.ok) throw new Error(`Overpass error ${res.status}: ${await res.text()}`);
  return res.json();
}

function extractLines(elements) {
  const nodeById = new Map();
  const relations = [];
  for (const el of elements) {
    if (el.type === "node") nodeById.set(el.id, el);
    else if (el.type === "relation") relations.push(el);
  }

  const lines = [];
  for (const rel of relations) {
    const stops = [];
    const seenNames = new Set();
    for (const member of rel.members ?? []) {
      if (member.type !== "node") continue;
      if (!member.role || !member.role.startsWith("stop")) continue;
      const node = nodeById.get(member.ref);
      if (!node?.tags?.name) continue;
      if (seenNames.has(node.tags.name)) continue; // dedupe stop+platform pairs
      seenNames.add(node.tags.name);
      stops.push({ name: node.tags.name, lat: node.lat, lon: node.lon });
    }
    if (stops.length < 2) continue;
    lines.push({
      ref: rel.tags.ref || rel.tags.name,
      name: rel.tags.name,
      color: rel.tags.colour || null,
      stations: stops,
    });
  }
  return lines;
}

async function main() {
  const outDir = path.join(process.cwd(), "src/lib/mock-data/generated");
  await mkdir(outDir, { recursive: true });

  const all = {};

  for (const city of CITIES) {
    console.log(`Fetching metro relations for ${city.id}...`);
    try {
      const data = await queryOverpass(buildQuery(city.bbox));
      const lines = extractLines(data.elements ?? []);
      all[city.id] = lines;
      console.log(`  -> ${lines.length} lines (${lines.map((l) => `${l.ref}:${l.stations.length}`).join(", ")})`);
    } catch (err) {
      console.error(`  FAILED for ${city.id}:`, err.message);
      all[city.id] = [];
    }
    await sleep(5000);
  }

  await writeFile(path.join(outDir, "metro.json"), JSON.stringify(all, null, 2));
  console.log("Done. Wrote src/lib/mock-data/generated/metro.json");
}

main();

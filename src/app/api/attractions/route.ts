import { NextRequest, NextResponse } from "next/server";
import { findAttractionsNear } from "@/lib/osm-client";
import { categorizeAttraction, emojiForAttraction } from "@/lib/mock-data/attraction-map";

// Overpass queries for this route can take longer than Vercel's 10s default
// function timeout, which kills the request before Overpass even replies.
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lon = parseFloat(req.nextUrl.searchParams.get("lon") ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  try {
    const places = await findAttractionsNear(lat, lon);
    const results = places
      .map((p) => ({
        osmId: p.osmId,
        name: p.name,
        lat: p.lat,
        lon: p.lon,
        categories: categorizeAttraction(p.tags),
        emoji: emojiForAttraction(p.tags),
        openingHours: p.tags.opening_hours,
        phone: p.tags.phone ?? p.tags["contact:phone"],
        website: p.tags.website ?? p.tags["contact:website"],
        wikidataId: p.tags.wikidata,
      }))
      .filter((p) => p.categories.length > 0);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "attractions_failed" }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { findAttractionsNear } from "@/lib/osm-client";
import { categorizeAttraction, emojiForAttraction } from "@/lib/mock-data/attraction-map";

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
      }))
      .filter((p) => p.categories.length > 0);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "attractions_failed" }, { status: 502 });
  }
}

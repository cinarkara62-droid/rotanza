import { NextRequest, NextResponse } from "next/server";
import { findPlacesNear } from "@/lib/osm-client";

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
    const places = await findPlacesNear(lat, lon, "viewpoint");
    return NextResponse.json({
      results: places.map((p) => ({ osmId: p.osmId, name: p.name, lat: p.lat, lon: p.lon })),
    });
  } catch {
    return NextResponse.json({ results: [], error: "viewpoints_failed" }, { status: 502 });
  }
}

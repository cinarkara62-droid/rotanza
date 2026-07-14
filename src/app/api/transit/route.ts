import { NextRequest, NextResponse } from "next/server";
import { findTransitLinesNear } from "@/lib/osm-client";

// Overpass relation queries can take longer than Vercel's 10s default
// function timeout, which kills the request before Overpass even replies.
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lon = parseFloat(req.nextUrl.searchParams.get("lon") ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  try {
    const lines = await findTransitLinesNear(lat, lon);
    return NextResponse.json({ lines });
  } catch {
    // Includes timeouts — relation queries are heavy and some cities have no
    // subway/light_rail relations mapped in OSM at all. Treat as "none found".
    return NextResponse.json({ lines: [], timedOutOrUnavailable: true });
  }
}

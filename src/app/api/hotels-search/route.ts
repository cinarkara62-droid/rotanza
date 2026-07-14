import { NextRequest, NextResponse } from "next/server";
import { geocodeSearch } from "@/lib/osm-client";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json({ results: [] });

  try {
    const results = await geocodeSearch(q, 8);
    return NextResponse.json({
      results: results.map((r) => ({
        osmId: r.osmId,
        name: r.name,
        displayName: r.displayName,
        lat: r.lat,
        lon: r.lon,
      })),
    });
  } catch {
    return NextResponse.json({ results: [], error: "search_failed" }, { status: 502 });
  }
}

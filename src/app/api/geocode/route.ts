import { NextRequest, NextResponse } from "next/server";
import { geocodeSearch } from "@/lib/osm-client";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  try {
    const results = await geocodeSearch(q, 6);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "geocode_failed" }, { status: 502 });
  }
}

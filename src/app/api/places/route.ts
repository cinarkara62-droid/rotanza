import { NextRequest, NextResponse } from "next/server";
import { findPlacesNear } from "@/lib/osm-client";
import { labelCuisine, emojiForCuisine } from "@/lib/mock-data/cuisine-map";

// Overpass queries for this route can take longer than Vercel's 10s default
// function timeout, which kills the request before Overpass even replies.
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lon = parseFloat(req.nextUrl.searchParams.get("lon") ?? "");
  const kind = req.nextUrl.searchParams.get("kind") === "hotel" ? "hotel" : "restaurant";

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  try {
    const places = await findPlacesNear(lat, lon, kind);
    if (kind === "hotel") {
      return NextResponse.json({
        results: places.map((p) => ({
          osmId: p.osmId,
          name: p.name,
          lat: p.lat,
          lon: p.lon,
          address: p.tags["addr:street"]
            ? `${p.tags["addr:street"]}${p.tags["addr:housenumber"] ? " " + p.tags["addr:housenumber"] : ""}`
            : undefined,
          stars: p.tags.stars ? Number(p.tags.stars) : undefined,
        })),
      });
    }
    return NextResponse.json({
      results: places.map((p) => {
        const cuisine = labelCuisine(p.tags.cuisine);
        return {
          osmId: p.osmId,
          name: p.name,
          lat: p.lat,
          lon: p.lon,
          address: p.tags["addr:street"]
            ? `${p.tags["addr:street"]}${p.tags["addr:housenumber"] ? " " + p.tags["addr:housenumber"] : ""}`
            : undefined,
          cuisineTr: cuisine.tr,
          cuisineEn: cuisine.en,
          emoji: emojiForCuisine(p.tags.cuisine),
        };
      }),
    });
  } catch {
    return NextResponse.json({ results: [], error: "places_failed" }, { status: 502 });
  }
}

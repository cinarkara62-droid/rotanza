import { NextRequest, NextResponse } from "next/server";
import { generateAiItinerary, type AiItineraryCandidate } from "@/lib/claude";
import type { PointOfInterest, InterestTag } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  const body = (await req.json()) as {
    destination?: string;
    days?: number;
    interests?: InterestTag[];
    budgetLevel?: string;
    pois?: PointOfInterest[];
    locale?: string;
  };
  const { destination, days, interests, budgetLevel, pois, locale } = body;

  if (!destination || !days || !pois || pois.length === 0) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const poiById = new Map(pois.map((p) => [p.id, p]));
  const candidates: AiItineraryCandidate[] = pois.map((p) => ({
    id: p.id,
    name: locale === "tr" ? p.nameTr : p.nameEn,
    tags: p.tags,
    slotHint: p.slot,
    lat: p.lat,
    lon: p.lon,
  }));

  try {
    const aiDays = await generateAiItinerary({
      destination,
      days,
      interests: interests ?? [],
      budgetLevel: budgetLevel ?? "standard",
      candidates,
      locale: locale ?? "tr",
    });

    const itinerary = aiDays.map((d) => {
      type Stop = PointOfInterest & { aiTip?: string; bestVisitTime?: string; crowdNote?: string };
      const entry: { day: number; morning?: Stop; afternoon?: Stop; evening?: Stop } = { day: d.day };
      for (const stop of d.stops) {
        const poi = poiById.get(stop.poiId);
        if (!poi) continue;
        entry[stop.slot] = { ...poi, aiTip: stop.tip, bestVisitTime: stop.bestVisitTime, crowdNote: stop.crowdNote };
      }
      return entry;
    });

    return NextResponse.json({ itinerary });
  } catch {
    return NextResponse.json({ error: "ai_generation_failed" }, { status: 502 });
  }
}

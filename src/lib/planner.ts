import { getPoisForCity } from "@/lib/mock-data/pois";
import { InterestTag, PointOfInterest } from "@/lib/types";

export interface ItineraryStop extends PointOfInterest {
  aiTip?: string;
  bestVisitTime?: string;
  crowdNote?: string;
}

export interface ItineraryDay {
  day: number;
  morning?: ItineraryStop;
  afternoon?: ItineraryStop;
  evening?: ItineraryStop;
}

const SLOTS: Array<"morning" | "afternoon" | "evening"> = ["morning", "afternoon", "evening"];

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Randomized on every call (Fisher–Yates shuffle) so hitting "regenerate"
// with the same city/days/interests produces a genuinely different route
// instead of always repeating the first matches.
export function generateItineraryFromPois(
  allPois: PointOfInterest[],
  days: number,
  interests: InterestTag[]
): ItineraryDay[] {
  const matched = interests.length
    ? allPois.filter((p) => p.tags.some((t) => interests.includes(t)))
    : allPois;
  const pool = shuffle(matched.length ? matched : allPois);
  const fallbackPool = shuffle(allPois);

  const used = new Set<string>();
  const result: ItineraryDay[] = [];

  for (let day = 1; day <= days; day++) {
    const entry: ItineraryDay = { day };
    for (const slot of SLOTS) {
      const bySlot = pool.find((p) => p.slot === slot && !used.has(p.id));
      const anyFromPool = pool.find((p) => !used.has(p.id));
      const bySlotFallback = fallbackPool.find((p) => p.slot === slot && !used.has(p.id));
      const anyFallback = fallbackPool.find((p) => !used.has(p.id));
      const pick = bySlot ?? anyFromPool ?? bySlotFallback ?? anyFallback;
      if (pick) {
        entry[slot] = pick;
        used.add(pick.id);
      }
    }
    result.push(entry);
  }

  return result;
}

export function generateItinerary(cityId: string, days: number, interests: InterestTag[]): ItineraryDay[] {
  return generateItineraryFromPois(getPoisForCity(cityId), days, interests);
}

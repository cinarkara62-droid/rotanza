import { cities } from "@/lib/mock-data/cities";

export function parseQuickSearch(text: string): { cityId?: string; days?: number } {
  const lower = text.toLowerCase();

  const city = cities.find(
    (c) => lower.includes(c.cityTr.toLowerCase()) || lower.includes(c.cityEn.toLowerCase())
  );

  const daysMatch = lower.match(/(\d+)\s*(day|days|gün|günlük)/);
  const days = daysMatch ? Math.min(7, Math.max(1, parseInt(daysMatch[1], 10))) : undefined;

  return { cityId: city?.id, days };
}

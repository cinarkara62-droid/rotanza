import { InterestTag } from "@/lib/types";

// Maps raw OSM tags to our app's interest categories — shared between the
// batch fetch script's output and the live /api/attractions route so both
// sources of attraction data behave identically.
export function categorizeAttraction(tags: Record<string, string>): InterestTag[] {
  const cats = new Set<InterestTag>();
  if (tags.tourism === "museum") {
    cats.add("art");
    cats.add("history");
  }
  if (tags.tourism === "gallery") cats.add("art");
  if (tags.tourism === "attraction" || tags.tourism === "viewpoint") cats.add("nature");
  if (tags.historic) cats.add("history");
  if (tags.leisure === "park" || tags.natural === "beach") cats.add("nature");
  if (["bar", "pub", "nightclub"].includes(tags.amenity)) cats.add("nightlife");
  if (tags.shop === "mall" || tags.amenity === "marketplace") cats.add("shopping");
  return [...cats];
}

export function emojiForAttraction(tags: Record<string, string>): string {
  if (tags.tourism === "museum") return "🏛️";
  if (tags.tourism === "gallery") return "🎨";
  if (tags.tourism === "viewpoint") return "🌇";
  if (tags.historic) return "🏺";
  if (tags.leisure === "park") return "🌳";
  if (tags.natural === "beach") return "🏖️";
  if (tags.amenity === "bar" || tags.amenity === "pub") return "🍻";
  if (tags.amenity === "nightclub") return "🎶";
  if (tags.shop === "mall" || tags.amenity === "marketplace") return "🛍️";
  return "📍";
}

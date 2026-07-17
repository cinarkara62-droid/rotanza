// Shared between the server-side Claude prompt (src/lib/claude.ts) and the
// client-side CompareClient UI — kept in its own file (no Anthropic SDK
// import) so client components can import it without bundling server code.
export const COMPARE_CATEGORIES = [
  "bestTime",
  "culture",
  "nightlife",
  "transport",
  "food",
  "price",
  "safety",
  "familyFriendly",
  "couples",
  "soloTravel",
  "walkability",
  "publicTransit",
] as const;

export type CompareCategory = (typeof COMPARE_CATEGORIES)[number];

export type DestinationComparison = Record<CompareCategory, { a: string; b: string }> & {
  recommendation: string;
};

import Anthropic from "@anthropic-ai/sdk";
import { COMPARE_CATEGORIES, type DestinationComparison } from "@/lib/compare-categories";

// Lazily constructed so the app still builds/runs without a Claude key —
// only the AI itinerary/compare routes need this, and they fall back to the
// existing rule-based generator when it's not configured. Same pattern as
// src/lib/amadeus.ts and src/lib/stripe.ts.
let claudeSingleton: Anthropic | null = null;

function getClaude(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env after creating an Anthropic Console account."
    );
  }
  if (!claudeSingleton) {
    claudeSingleton = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return claudeSingleton;
}

const MODEL = "claude-opus-4-8";

export interface AiItineraryCandidate {
  id: string;
  name: string;
  tags: string[];
  slotHint: "morning" | "afternoon" | "evening";
  lat?: number;
  lon?: number;
}

export interface AiItineraryStop {
  poiId: string;
  slot: "morning" | "afternoon" | "evening";
  tip: string;
  bestVisitTime: string;
  crowdNote: string;
}

export interface AiItineraryDay {
  day: number;
  stops: AiItineraryStop[];
}

const ITINERARY_SCHEMA = {
  type: "object" as const,
  properties: {
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "integer" },
          stops: {
            type: "array",
            items: {
              type: "object",
              properties: {
                poiId: { type: "string" },
                slot: { type: "string", enum: ["morning", "afternoon", "evening"] },
                tip: { type: "string" },
                bestVisitTime: { type: "string" },
                crowdNote: { type: "string" },
              },
              required: ["poiId", "slot", "tip", "bestVisitTime", "crowdNote"],
              additionalProperties: false,
            },
          },
        },
        required: ["day", "stops"],
        additionalProperties: false,
      },
    },
  },
  required: ["days"],
  additionalProperties: false,
};

export async function generateAiItinerary(params: {
  destination: string;
  days: number;
  interests: string[];
  budgetLevel: string;
  candidates: AiItineraryCandidate[];
  locale: string;
}): Promise<AiItineraryDay[]> {
  const client = getClaude();
  const isTr = params.locale === "tr";

  const candidateList = params.candidates
    .map(
      (c) =>
        `- id: ${c.id} | ${c.name} | tags: ${c.tags.join(", ")} | usual time of day: ${c.slotHint}${
          c.lat != null && c.lon != null ? ` | coords: ${c.lat.toFixed(4)},${c.lon.toFixed(4)}` : ""
        }`
    )
    .join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    output_config: { format: { type: "json_schema", schema: ITINERARY_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `You are a travel-itinerary planner for ${params.destination}, planning ${params.days} day(s).
Traveler interests: ${params.interests.join(", ") || "general sightseeing"}. Budget level: ${params.budgetLevel}.

Choose stops ONLY from this candidate list (reference each by its exact "id" — never invent a new place or id):
${candidateList}

Assign each chosen stop to a day and a time slot (morning/afternoon/evening), grouping geographically close stops on the same day when coordinates are given so the route doesn't backtrack across the city. Prefer stops matching the traveler's interests. Use each candidate at most once. For each stop write: a one-sentence "tip" (a short practical suggestion), a short "bestVisitTime" (e.g. "09:00" or "sunset"), and a one-sentence "crowdNote" giving your best general estimate of when it's busiest/quietest for this kind of place (clearly a general estimate, not measured data). Write "tip", "bestVisitTime" and "crowdNote" in ${isTr ? "Turkish" : "English"}.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Claude returned no text content");
  const parsed = JSON.parse(block.text) as { days: AiItineraryDay[] };
  return parsed.days;
}

export interface ViewpointInsight {
  reason: string;
  sunsetSuitability: string;
  crowdLevel: string;
}

const VIEWPOINT_SCHEMA = {
  type: "object" as const,
  properties: {
    reason: { type: "string" },
    sunsetSuitability: { type: "string" },
    crowdLevel: { type: "string" },
  },
  required: ["reason", "sunsetSuitability", "crowdLevel"],
  additionalProperties: false,
};

export async function generateViewpointInsight(params: {
  name: string;
  destination: string;
  locale: string;
}): Promise<ViewpointInsight> {
  const client = getClaude();
  const isTr = params.locale === "tr";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    output_config: { format: { type: "json_schema", schema: VIEWPOINT_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `"${params.name}" is a photo/viewpoint spot in ${params.destination}, tagged as a viewpoint on OpenStreetMap. Give a brief, general (not measured) estimate of: why it's a good photo spot ("reason"), how suitable it is for sunset photography ("sunsetSuitability"), and its typical crowd level ("crowdLevel"). One short sentence each, in ${isTr ? "Turkish" : "English"}. Make clear these are general estimates, not verified facts.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Claude returned no text content");
  return JSON.parse(block.text) as ViewpointInsight;
}

const COMPARE_SCHEMA = {
  type: "object" as const,
  properties: {
    ...Object.fromEntries(
      COMPARE_CATEGORIES.map((cat) => [
        cat,
        {
          type: "object",
          properties: { a: { type: "string" }, b: { type: "string" } },
          required: ["a", "b"],
          additionalProperties: false,
        },
      ])
    ),
    recommendation: { type: "string" },
  },
  required: [...COMPARE_CATEGORIES, "recommendation"],
  additionalProperties: false,
};

export async function generateDestinationComparison(params: {
  destinationA: string;
  destinationB: string;
  preferences?: string;
  locale: string;
}): Promise<DestinationComparison> {
  const client = getClaude();
  const isTr = params.locale === "tr";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    output_config: { format: { type: "json_schema", schema: COMPARE_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Compare these two travel destinations for a traveler deciding between them: "${params.destinationA}" vs "${params.destinationB}".${
          params.preferences ? ` The traveler's stated preferences: ${params.preferences}.` : ""
        }

For each category below, write a short phrase (a few words) describing destination A and destination B respectively: best time to visit (bestTime), culture, nightlife, transport, food, price level, safety, family-friendliness, suitability for couples, suitability for solo travel, walkability, and public transit quality.

Then write a short "recommendation" paragraph (2-4 sentences) saying which destination you'd recommend and why, tailored to the traveler's stated preferences if given, otherwise a balanced general take.

Write everything in ${isTr ? "Turkish" : "English"}.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Claude returned no text content");
  return JSON.parse(block.text) as DestinationComparison;
}

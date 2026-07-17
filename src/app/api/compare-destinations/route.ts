import { NextRequest, NextResponse } from "next/server";
import { generateDestinationComparison } from "@/lib/claude";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  const body = (await req.json()) as {
    destinationA?: string;
    destinationB?: string;
    preferences?: string;
    locale?: string;
  };
  const { destinationA, destinationB, preferences, locale } = body;
  if (!destinationA || !destinationB) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const comparison = await generateDestinationComparison({
      destinationA,
      destinationB,
      preferences,
      locale: locale ?? "tr",
    });
    return NextResponse.json({ comparison });
  } catch {
    return NextResponse.json({ error: "ai_generation_failed" }, { status: 502 });
  }
}

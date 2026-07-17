import { NextRequest, NextResponse } from "next/server";
import { generateViewpointInsight } from "@/lib/claude";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  const body = (await req.json()) as { name?: string; destination?: string; locale?: string };
  const { name, destination, locale } = body;
  if (!name || !destination) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const insight = await generateViewpointInsight({ name, destination, locale: locale ?? "tr" });
    return NextResponse.json({ insight });
  } catch {
    return NextResponse.json({ error: "ai_generation_failed" }, { status: 502 });
  }
}

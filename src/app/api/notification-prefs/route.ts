import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Only these keys are actually acted on by the reminders cron
// (src/app/api/cron/travel-notifications/route.ts) — the rest persist but
// have no real data source wired up yet (see SmartNotificationsCard).
export const IMPLEMENTED_NOTIFICATION_KEYS = ["checkin", "hotelCheckin"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  return NextResponse.json({ plan: user.plan, prefs: user.notificationPrefs ?? {} });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { key?: string; enabled?: boolean };
  const { key, enabled } = body;
  if (!key || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  if (user.plan === "free") return NextResponse.json({ error: "plan_required" }, { status: 403 });

  const prefs = { ...((user.notificationPrefs as Record<string, boolean>) ?? {}), [key]: enabled };
  await prisma.user.update({ where: { id: user.id }, data: { notificationPrefs: prefs } });

  return NextResponse.json({ prefs });
}

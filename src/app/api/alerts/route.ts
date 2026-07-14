import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const PLAN_LIMITS: Record<string, number> = { free: 1, pro: 10, max: Infinity };

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    type?: "hotel" | "flight";
    name?: string;
    location?: string;
    entityId?: string;
    targetPrice?: number;
  };
  const { type, name, location, entityId, targetPrice } = body;

  if (type !== "hotel" && type !== "flight") {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }
  if (!name || !location || !targetPrice || targetPrice <= 0) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (type === "hotel" && !entityId) {
    return NextResponse.json({ error: "hotel_requires_entity" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  const limit = PLAN_LIMITS[user.plan] ?? PLAN_LIMITS.free;
  const currentCount = await prisma.priceAlert.count({ where: { userId: user.id } });
  if (currentCount >= limit) {
    return NextResponse.json({ error: "plan_limit_reached" }, { status: 403 });
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId: user.id,
      type,
      name,
      location,
      entityId: entityId ?? null,
      currentPrice: targetPrice,
      previousPrice: targetPrice,
      targetPrice,
      lowestPrice: targetPrice,
      priceHistory: [targetPrice],
    },
  });

  return NextResponse.json({ alert });
}

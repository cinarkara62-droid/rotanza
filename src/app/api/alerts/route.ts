import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { searchFlightOffers } from "@/lib/amadeus";

const PLAN_LIMITS: Record<string, number> = { free: 1, pro: 10, max: Infinity };
const IATA_RE = /^[A-Z]{3}$/;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ alerts });
}

// Hotel price alerts are not accepted anymore — there is no real hotel
// pricing source connected yet (Hotellook is pending Travelpayouts
// approval), and freezing the alert at the user's own target price was
// misleading (it could never actually detect a real price drop). Flights
// are backed by a real Amadeus flight-offer search.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    originIata?: string;
    destinationIata?: string;
    departureDate?: string;
    targetPrice?: number;
  };
  const originIata = body.originIata?.trim().toUpperCase();
  const destinationIata = body.destinationIata?.trim().toUpperCase();
  const { departureDate, targetPrice } = body;

  if (!originIata || !IATA_RE.test(originIata) || !destinationIata || !IATA_RE.test(destinationIata)) {
    return NextResponse.json({ error: "invalid_airport_code" }, { status: 400 });
  }
  if (!departureDate || Number.isNaN(new Date(departureDate).getTime())) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  if (!targetPrice || targetPrice <= 0) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  const limit = PLAN_LIMITS[user.plan] ?? PLAN_LIMITS.free;
  const currentCount = await prisma.priceAlert.count({ where: { userId: user.id } });
  if (currentCount >= limit) {
    return NextResponse.json({ error: "plan_limit_reached" }, { status: 403 });
  }

  let currentPrice: number;
  try {
    const offers = await searchFlightOffers({ origin: originIata, destination: destinationIata, departureDate });
    if (offers.length === 0) return NextResponse.json({ error: "no_flights_found" }, { status: 404 });
    currentPrice = Math.min(...offers.map((o) => o.price));
  } catch {
    return NextResponse.json({ error: "flight_pricing_unavailable" }, { status: 503 });
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId: user.id,
      type: "flight",
      name: `${originIata} → ${destinationIata}`,
      location: departureDate,
      entityId: `flight:${originIata}:${destinationIata}:${departureDate}`,
      currentPrice,
      previousPrice: currentPrice,
      targetPrice,
      lowestPrice: currentPrice,
      priceHistory: [currentPrice],
    },
  });

  return NextResponse.json({ alert });
}

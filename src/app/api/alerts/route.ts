import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { searchFlightOffers, searchHotelOffers } from "@/lib/amadeus";

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

// Both alert types are backed by real Amadeus pricing (same free
// self-service API key as flights): flights use flight-offers search,
// hotels use the by-city hotel list + hotel-offers search, tracking the
// cheapest available room in that city for the given date range.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    type?: "flight" | "hotel";
    originIata?: string;
    destinationIata?: string;
    departureDate?: string;
    cityIata?: string;
    cityName?: string;
    checkInDate?: string;
    checkOutDate?: string;
    targetPrice?: number;
  };
  const { targetPrice } = body;
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

  if (body.type === "hotel") {
    const cityIata = body.cityIata?.trim().toUpperCase();
    const { checkInDate, checkOutDate, cityName } = body;
    if (!cityIata || !IATA_RE.test(cityIata)) {
      return NextResponse.json({ error: "invalid_city_code" }, { status: 400 });
    }
    if (!checkInDate || Number.isNaN(new Date(checkInDate).getTime()) || !checkOutDate || Number.isNaN(new Date(checkOutDate).getTime())) {
      return NextResponse.json({ error: "invalid_date" }, { status: 400 });
    }
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      return NextResponse.json({ error: "invalid_date" }, { status: 400 });
    }

    let currentPrice: number;
    let hotelName: string;
    try {
      const offers = await searchHotelOffers({ cityIata, checkInDate, checkOutDate });
      if (offers.length === 0) return NextResponse.json({ error: "no_hotels_found" }, { status: 404 });
      const cheapest = offers.reduce((min, o) => (o.price < min.price ? o : min), offers[0]);
      currentPrice = cheapest.price;
      hotelName = cheapest.hotelName;
    } catch {
      return NextResponse.json({ error: "hotel_pricing_unavailable" }, { status: 503 });
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId: user.id,
        type: "hotel",
        name: cityName ? `${cityName} — ${hotelName}` : hotelName,
        location: `${checkInDate} → ${checkOutDate}`,
        entityId: `hotel:${cityIata}:${checkInDate}:${checkOutDate}`,
        currentPrice,
        previousPrice: currentPrice,
        targetPrice,
        lowestPrice: currentPrice,
        priceHistory: [currentPrice],
      },
    });
    return NextResponse.json({ alert });
  }

  const originIata = body.originIata?.trim().toUpperCase();
  const destinationIata = body.destinationIata?.trim().toUpperCase();
  const { departureDate } = body;

  if (!originIata || !IATA_RE.test(originIata) || !destinationIata || !IATA_RE.test(destinationIata)) {
    return NextResponse.json({ error: "invalid_airport_code" }, { status: 400 });
  }
  if (!departureDate || Number.isNaN(new Date(departureDate).getTime())) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
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

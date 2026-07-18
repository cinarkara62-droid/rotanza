import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchFlightOffers, searchHotelOffers } from "@/lib/amadeus";

export const maxDuration = 30;

// Refreshes both alert types against real Amadeus pricing: flight-offers
// search for flights, and the cheapest city-wide hotel-offer for hotels.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.priceAlert.findMany({
    where: { OR: [{ entityId: { startsWith: "flight:" } }, { entityId: { startsWith: "hotel:" } }] },
  });

  let updated = 0;
  let skippedExpired = 0;
  let failed = 0;

  for (const alert of alerts) {
    const parts = alert.entityId?.split(":") ?? [];

    try {
      let newPrice: number | null = null;

      if (parts[0] === "flight") {
        const [, origin, destination, departureDate] = parts;
        if (!origin || !destination || !departureDate) {
          failed++;
          continue;
        }
        if (new Date(departureDate).getTime() < Date.now()) {
          skippedExpired++;
          continue;
        }
        const offers = await searchFlightOffers({ origin, destination, departureDate });
        if (offers.length > 0) newPrice = Math.min(...offers.map((o) => o.price));
      } else if (parts[0] === "hotel") {
        const [, cityIata, checkInDate, checkOutDate] = parts;
        if (!cityIata || !checkInDate || !checkOutDate) {
          failed++;
          continue;
        }
        if (new Date(checkInDate).getTime() < Date.now()) {
          skippedExpired++;
          continue;
        }
        const offers = await searchHotelOffers({ cityIata, checkInDate, checkOutDate });
        if (offers.length > 0) newPrice = Math.min(...offers.map((o) => o.price));
      } else {
        failed++;
        continue;
      }

      if (newPrice == null) continue;

      await prisma.priceAlert.update({
        where: { id: alert.id },
        data: {
          previousPrice: alert.currentPrice,
          currentPrice: newPrice,
          lowestPrice: Math.min(alert.lowestPrice, newPrice),
          priceHistory: [...alert.priceHistory, newPrice].slice(-30),
        },
      });
      updated++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ checked: alerts.length, updated, skippedExpired, failed });
}

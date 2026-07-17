import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchFlightOffers } from "@/lib/amadeus";

export const maxDuration = 30;

// Refreshes flight price alerts against real Amadeus pricing. Hotel-type
// alerts (if any remain from before hotel alerts were disabled) are left
// untouched — there's still no real hotel pricing source connected.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const flightAlerts = await prisma.priceAlert.findMany({
    where: { type: "flight", entityId: { startsWith: "flight:" } },
  });

  let updated = 0;
  let skippedExpired = 0;
  let failed = 0;

  for (const alert of flightAlerts) {
    const parts = alert.entityId?.split(":") ?? [];
    const [, origin, destination, departureDate] = parts;
    if (!origin || !destination || !departureDate) {
      failed++;
      continue;
    }
    if (new Date(departureDate).getTime() < Date.now()) {
      skippedExpired++;
      continue;
    }

    try {
      const offers = await searchFlightOffers({ origin, destination, departureDate });
      if (offers.length === 0) continue;
      const newPrice = Math.min(...offers.map((o) => o.price));

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

  return NextResponse.json({ checked: flightAlerts.length, updated, skippedExpired, failed });
}

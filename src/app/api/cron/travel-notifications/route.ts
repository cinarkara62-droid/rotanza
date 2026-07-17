import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTravelNotification } from "@/lib/email";

export const maxDuration = 30;

// Only two of the eight "Smart Travel Notifications" toggles are handled
// here — the ones that fit a once-a-day cron honestly:
//   - "checkin": flight reservations, 24-48h before departure (same window
//     as the existing reservation-reminders cron).
//   - "hotelCheckin": hotel reservations, the morning of check-in day.
// Boarding/transfer alerts need a precise few-hours-before window a daily
// cron can't reliably hit (would need at least hourly runs — a Vercel Pro
// plan feature); delay/gate/weather/local-transit need real-time flight,
// weather, and transit data we don't have. Those six stay UI-only in
// SmartNotificationsCard rather than shipping something that looks live
// but rarely fires at the right time.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let checkinSent = 0;
  let hotelCheckinSent = 0;
  let failed = 0;

  const checkinWindowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const checkinWindowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const dueCheckins = await prisma.reservation.findMany({
    where: {
      type: "flight",
      date: { gte: checkinWindowStart, lte: checkinWindowEnd },
      checkinNotifiedAt: null,
    },
    include: { user: true },
  });

  for (const r of dueCheckins) {
    const prefs = (r.user.notificationPrefs as Record<string, boolean>) ?? {};
    if (r.user.plan === "free" || !prefs.checkin) continue;
    try {
      await sendTravelNotification({
        to: r.user.email,
        emoji: "✈️",
        headlineTr: "Check-in zamanı yaklaşıyor",
        headlineEn: "Check-in is coming up",
        bodyTr: "Online check-in yakında açılıyor, bu uçuşun için hazırlanmayı unutma.",
        bodyEn: "Online check-in opens soon — get ready for this flight.",
        title: r.title,
        date: r.date.toISOString().slice(0, 10),
        time: r.time,
        locale: "tr",
      });
      await prisma.reservation.update({ where: { id: r.id }, data: { checkinNotifiedAt: new Date() } });
      checkinSent++;
    } catch {
      failed++;
    }
  }

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const dueHotelCheckins = await prisma.reservation.findMany({
    where: {
      type: "hotel",
      date: { gte: todayStart, lte: todayEnd },
      hotelCheckinNotifiedAt: null,
    },
    include: { user: true },
  });

  for (const r of dueHotelCheckins) {
    const prefs = (r.user.notificationPrefs as Record<string, boolean>) ?? {};
    if (r.user.plan === "free" || !prefs.hotelCheckin) continue;
    try {
      await sendTravelNotification({
        to: r.user.email,
        emoji: "🏨",
        headlineTr: "Bugün otel check-in günün",
        headlineEn: "Today is your hotel check-in day",
        bodyTr: "Otelinize bugün giriş yapabilirsiniz.",
        bodyEn: "You can check in to your hotel today.",
        title: r.title,
        date: r.date.toISOString().slice(0, 10),
        time: r.time,
        locale: "tr",
      });
      await prisma.reservation.update({ where: { id: r.id }, data: { hotelCheckinNotifiedAt: new Date() } });
      hotelCheckinSent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    checked: dueCheckins.length + dueHotelCheckins.length,
    checkinSent,
    hotelCheckinSent,
    failed,
  });
}

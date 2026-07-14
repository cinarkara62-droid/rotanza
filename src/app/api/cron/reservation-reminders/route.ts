import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReservationReminder } from "@/lib/email";

export const maxDuration = 30;

// Triggered daily by Vercel Cron (see vercel.json). Finds reservations whose
// date falls within the next 24-48 hours and emails a one-time reminder.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const due = await prisma.reservation.findMany({
    where: {
      date: { gte: windowStart, lte: windowEnd },
      reminderSentAt: null,
    },
    include: { user: true },
  });

  let sent = 0;
  let failed = 0;

  for (const reservation of due) {
    try {
      if (!process.env.RESEND_API_KEY) {
        failed++;
        continue; // no email service configured yet — skip gracefully
      }
      await sendReservationReminder({
        to: reservation.user.email,
        title: reservation.title,
        type: reservation.type,
        date: reservation.date.toISOString().slice(0, 10),
        time: reservation.time,
        locale: "tr",
      });
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ checked: due.length, sent, failed });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ reservations });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    type?: string;
    title?: string;
    date?: string;
    time?: string;
    confirmation?: string;
    notes?: string;
  };
  const { type, title, date, time, confirmation, notes } = body;

  if (!type || !["flight", "hotel", "restaurant", "activity"].includes(type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }
  if (!title || !date) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const reservation = await prisma.reservation.create({
    data: {
      userId: session.user.id,
      type,
      title,
      date: parsedDate,
      time: time || null,
      confirmation: confirmation || null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ reservation });
}

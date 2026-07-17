import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTradeInput } from "@/lib/validate-trade";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const range = searchParams.get("range");

  const where: { userId: string; tradeDate?: { gte?: Date; lt?: Date } } = { userId: session.user.id };

  if (yearParam !== null && monthParam !== null) {
    const year = Number(yearParam);
    const month = Number(monthParam);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
      return NextResponse.json({ error: "Invalid year or month." }, { status: 400 });
    }
    where.tradeDate = { gte: new Date(year, month, 1), lt: new Date(year, month + 1, 1) };
  } else if (range === "month" || range === "90d" || range === "ytd" || range === "all") {
    // Analytics page's range tabs — computed server-side against "now" so the
    // client never has to duplicate this date math (or get timezone edge
    // cases wrong doing it independently of the Overview page's month mode).
    const now = new Date();
    if (range === "month") {
      where.tradeDate = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (range === "90d") {
      const from = new Date(now);
      from.setDate(from.getDate() - 90);
      where.tradeDate = { gte: from };
    } else if (range === "ytd") {
      where.tradeDate = { gte: new Date(now.getFullYear(), 0, 1) };
    }
    // "all" leaves where.tradeDate undefined — no lower bound.
  } else {
    return NextResponse.json({ error: "Provide year+month or a valid range." }, { status: 400 });
  }

  const trades = await prisma.trade.findMany({
    where,
    orderBy: { tradeDate: "asc" },
  });

  return NextResponse.json({ trades });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateTradeInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const trade = await prisma.trade.create({
    data: {
      ...validation.data,
      tradeDate: new Date(validation.data.tradeDate),
      exitDate: validation.data.exitDate === null ? null : new Date(validation.data.exitDate),
      userId: session.user.id,
    },
  });

  return NextResponse.json({ trade }, { status: 201 });
}

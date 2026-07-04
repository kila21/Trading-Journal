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
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    return NextResponse.json({ error: "Invalid year or month." }, { status: 400 });
  }

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id, tradeDate: { gte: start, lt: end } },
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
      userId: session.user.id,
    },
  });

  return NextResponse.json({ trade }, { status: 201 });
}

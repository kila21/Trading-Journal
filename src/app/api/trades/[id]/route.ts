import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTradeInput } from "@/lib/validate-trade";

async function getOwnedTrade(id: string, userId: string) {
  const trade = await prisma.trade.findUnique({ where: { id } });
  if (!trade || trade.userId !== userId) return null;
  return trade;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedTrade(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  const body = await request.json();
  const validation = validateTradeInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const trade = await prisma.trade.update({
    where: { id },
    data: {
      ...validation.data,
      tradeDate: new Date(validation.data.tradeDate),
      exitDate: validation.data.exitDate === null ? null : new Date(validation.data.exitDate),
    },
  });

  return NextResponse.json({ trade });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedTrade(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  await prisma.trade.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}

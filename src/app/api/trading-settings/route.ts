import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTradingSettingsInput } from "@/lib/validate-trading-settings";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.tradingSettings.findUnique({ where: { userId: session.user.id } });

  return NextResponse.json({ settings: settings ? { accountBalance: settings.accountBalance } : null });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateTradingSettingsInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const settings = await prisma.tradingSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, accountBalance: validation.data.accountBalance },
    update: { accountBalance: validation.data.accountBalance },
  });

  return NextResponse.json({ settings: { accountBalance: settings.accountBalance } });
}

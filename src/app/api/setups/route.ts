import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateSetupInput } from "@/lib/validate-setup";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const setups = await prisma.setup.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ setups });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateSetupInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const conflict = await prisma.setup.findFirst({
    where: { userId: session.user.id, name: validation.data.name },
  });
  if (conflict) {
    return NextResponse.json({ error: "A setup with this name already exists." }, { status: 409 });
  }

  const setup = await prisma.setup.create({
    data: { ...validation.data, userId: session.user.id },
  });

  return NextResponse.json({ setup }, { status: 201 });
}

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateSetupInput } from "@/lib/validate-setup";

async function getOwnedSetup(id: string, userId: string) {
  const setup = await prisma.setup.findUnique({ where: { id } });
  if (!setup || setup.userId !== userId) return null;
  return setup;
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
  const existing = await getOwnedSetup(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Setup not found." }, { status: 404 });
  }

  const body = await request.json();
  const validation = validateSetupInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const conflict = await prisma.setup.findFirst({
    where: { userId: session.user.id, name: validation.data.name, NOT: { id } },
  });
  if (conflict) {
    return NextResponse.json({ error: "A setup with this name already exists." }, { status: 409 });
  }

  const setup = await prisma.setup.update({
    where: { id },
    data: validation.data,
  });

  return NextResponse.json({ setup });
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
  const existing = await getOwnedSetup(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Setup not found." }, { status: 404 });
  }

  await prisma.setup.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tradeImageStorage } from "@/lib/trade-image-storage";
import { tradeTimeframes } from "@/config/trade-timeframes";

async function getOwnedImage(imageId: string, userId: string) {
  const image = await prisma.tradeImage.findUnique({
    where: { id: imageId },
    include: { trade: true },
  });
  if (!image || image.trade.userId !== userId) return null;
  return image;
}

export async function GET(_request: Request, { params }: { params: Promise<{ imageId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageId } = await params;
  const image = await getOwnedImage(imageId, session.user.id);
  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const buffer = await tradeImageStorage.read(image.storageKey);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ imageId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageId } = await params;
  const existing = await getOwnedImage(imageId, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const body = await request.json();
  const { timeframe, caption } = body as { timeframe?: unknown; caption?: unknown };
  const data: { timeframe?: string; caption?: string | null } = {};

  if (timeframe !== undefined) {
    if (typeof timeframe !== "string" || !tradeTimeframes.includes(timeframe as (typeof tradeTimeframes)[number])) {
      return NextResponse.json({ error: "Invalid timeframe." }, { status: 400 });
    }
    data.timeframe = timeframe;
  }

  if (caption !== undefined) {
    if (caption !== null && typeof caption !== "string") {
      return NextResponse.json({ error: "Caption must be text." }, { status: 400 });
    }
    data.caption = typeof caption === "string" && caption.trim().length > 0 ? caption.trim() : null;
  }

  const image = await prisma.tradeImage.update({ where: { id: imageId }, data });

  return NextResponse.json({
    image: {
      id: image.id,
      timeframe: image.timeframe,
      caption: image.caption,
      url: `/api/trade-images/${image.id}`,
    },
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ imageId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageId } = await params;
  const existing = await getOwnedImage(imageId, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  await tradeImageStorage.delete(existing.storageKey);
  await prisma.tradeImage.delete({ where: { id: imageId } });

  return new NextResponse(null, { status: 204 });
}

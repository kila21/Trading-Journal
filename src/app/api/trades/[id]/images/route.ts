import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tradeImageStorage } from "@/lib/trade-image-storage";
import { tradeTimeframes } from "@/config/trade-timeframes";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function getOwnedTrade(id: string, userId: string) {
  const trade = await prisma.trade.findUnique({ where: { id } });
  if (!trade || trade.userId !== userId) return null;
  return trade;
}

function isValidTimeframe(value: unknown): value is (typeof tradeTimeframes)[number] {
  return typeof value === "string" && tradeTimeframes.includes(value as (typeof tradeTimeframes)[number]);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const trade = await getOwnedTrade(id, session.user.id);
  if (!trade) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  const images = await prisma.tradeImage.findMany({
    where: { tradeId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    images: images.map((image) => ({
      id: image.id,
      timeframe: image.timeframe,
      caption: image.caption,
      url: `/api/trade-images/${image.id}`,
    })),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const trade = await getOwnedTrade(id, session.user.id);
  if (!trade) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const timeframe = formData.get("timeframe");
  const caption = formData.get("caption");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "An image file is required." }, { status: 400 });
  }
  if (!isValidTimeframe(timeframe)) {
    return NextResponse.json({ error: "Invalid timeframe." }, { status: 400 });
  }

  const extension = ALLOWED_MIME_TYPES[file.type];
  if (!extension) {
    return NextResponse.json({ error: "Only PNG, JPEG, or WEBP images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image must be smaller than 5MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await tradeImageStorage.save(buffer, extension);

  const image = await prisma.tradeImage.create({
    data: {
      tradeId: id,
      timeframe,
      storageKey,
      mimeType: file.type,
      caption: typeof caption === "string" && caption.trim().length > 0 ? caption.trim() : null,
    },
  });

  return NextResponse.json(
    {
      image: {
        id: image.id,
        timeframe: image.timeframe,
        caption: image.caption,
        url: `/api/trade-images/${image.id}`,
      },
    },
    { status: 201 },
  );
}

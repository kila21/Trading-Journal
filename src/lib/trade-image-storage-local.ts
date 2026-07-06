import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { TradeImageStorage } from "./trade-image-storage";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "trade-images");

async function save(buffer: Buffer, extension: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const storageKey = `${randomUUID()}.${extension}`;
  await writeFile(path.join(UPLOAD_DIR, storageKey), buffer);
  return storageKey;
}

async function read(storageKey: string): Promise<Buffer> {
  return readFile(path.join(UPLOAD_DIR, storageKey));
}

async function deleteImage(storageKey: string): Promise<void> {
  await unlink(path.join(UPLOAD_DIR, storageKey)).catch(() => {});
}

export const localTradeImageStorage: TradeImageStorage = {
  save,
  read,
  delete: deleteImage,
};

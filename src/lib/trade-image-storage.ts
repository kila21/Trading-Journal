import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Local-disk implementation for now — same pragmatic call as SQLite: works
 * immediately, gets swapped for real object storage (Netlify Blobs, Supabase
 * Storage, etc.) when deploying. Every call site only depends on this
 * `TradeImageStorage` shape, so that swap means writing one new
 * implementation of these three methods, not touching any route or component.
 */
export interface TradeImageStorage {
  save(buffer: Buffer, extension: string): Promise<string>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

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

export const tradeImageStorage: TradeImageStorage = {
  save,
  read,
  delete: deleteImage,
};

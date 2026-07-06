import { randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";
import type { TradeImageStorage } from "./trade-image-storage";

// Netlify Functions inject the store's siteID/token from the ambient runtime
// context automatically — no config needed here, unlike local dev.
const STORE_NAME = "trade-images";

function store() {
  return getStore(STORE_NAME);
}

async function save(buffer: Buffer, extension: string): Promise<string> {
  const storageKey = `${randomUUID()}.${extension}`;
  // BlobInput is `string | ArrayBuffer | Blob` — a Node Buffer isn't
  // directly assignable, so wrap it in a Blob.
  await store().set(storageKey, new Blob([new Uint8Array(buffer)]));
  return storageKey;
}

async function read(storageKey: string): Promise<Buffer> {
  const data = await store().get(storageKey, { type: "arrayBuffer" });
  if (!data) {
    throw new Error(`Image not found in blob store: ${storageKey}`);
  }
  return Buffer.from(data);
}

async function deleteImage(storageKey: string): Promise<void> {
  await store().delete(storageKey);
}

export const netlifyBlobsTradeImageStorage: TradeImageStorage = {
  save,
  read,
  delete: deleteImage,
};

import { localTradeImageStorage } from "./trade-image-storage-local";
import { netlifyBlobsTradeImageStorage } from "./trade-image-storage-blobs";

export interface TradeImageStorage {
  save(buffer: Buffer, extension: string): Promise<string>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

// Local dev always uses disk storage (zero setup). Production sets
// IMAGE_STORAGE_DRIVER=blobs in Netlify's env vars to switch to Netlify Blobs,
// since persistent local disk isn't available in Netlify's serverless functions.
export const tradeImageStorage: TradeImageStorage =
  process.env.IMAGE_STORAGE_DRIVER === "blobs"
    ? netlifyBlobsTradeImageStorage
    : localTradeImageStorage;

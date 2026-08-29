// Client-side guard for chart-image uploads. Mirrors the server rules in
// src/app/api/trades/[id]/images/route.ts (same MIME allow-list, same size
// cap) so a file accepted here would be accepted there too — the drag-drop
// and paste entry points check this before staging or uploading a file.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type ImageFileError = "type" | "size";

/** Null when the file is an acceptable chart image; otherwise which rule it broke. */
export function checkImageFile(file: File): ImageFileError | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "type";
  if (file.size > MAX_IMAGE_BYTES) return "size";
  return null;
}

/**
 * First acceptable image file out of a drop's `DataTransfer` or a paste's
 * `ClipboardData` — screenshot pastes arrive as a `File` item with an
 * `image/*` type. Returns null when nothing usable is present.
 */
export function firstImageFile(items: DataTransferItemList | null, files: FileList | null): File | null {
  if (items) {
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) return file;
      }
    }
  }
  if (files) {
    for (const file of files) {
      if (file.type.startsWith("image/")) return file;
    }
  }
  return null;
}

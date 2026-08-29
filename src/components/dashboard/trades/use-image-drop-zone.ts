"use client";

import { useCallback, useState, type ClipboardEvent, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { checkImageFile, firstImageFile } from "@/lib/image-file";

/**
 * Wires paste-a-screenshot and drag-and-drop onto a container. `onFile` gets a
 * validated image File; `onReject` gets a ready-to-show message for a file that
 * broke the type/size rules. Returns `dragActive` for a drop-target highlight
 * plus the handlers to spread onto the container element.
 */
export function useImageDropZone(onFile: (file: File) => void, onReject: (message: string) => void) {
  const t = useTranslations("dashboard");
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      const problem = checkImageFile(file);
      if (problem === "type") return onReject(t("imageTypeInvalid"));
      if (problem === "size") return onReject(t("imageTooLarge"));
      onFile(file);
    },
    [onFile, onReject, t],
  );

  return {
    dragActive,
    dropZoneProps: {
      onPaste: (event: ClipboardEvent) => {
        const file = firstImageFile(event.clipboardData.items, event.clipboardData.files);
        if (file) {
          event.preventDefault();
          handleFile(file);
        }
      },
      onDragOver: (event: DragEvent) => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          setDragActive(true);
        }
      },
      onDragLeave: () => setDragActive(false),
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        setDragActive(false);
        handleFile(firstImageFile(event.dataTransfer.items, event.dataTransfer.files));
      },
    },
  };
}

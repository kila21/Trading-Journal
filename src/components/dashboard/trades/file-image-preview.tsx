"use client";

import { useEffect, useMemo } from "react";

/**
 * Thumbnail preview for a not-yet-uploaded File (chosen, pasted, or dropped in
 * the add-timeframe form), with object-URL cleanup on unmount / file change.
 */
export function FileImagePreview({ file, className }: { file: File; className?: string }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a static asset
    <img src={url} alt="" className={className} />
  );
}

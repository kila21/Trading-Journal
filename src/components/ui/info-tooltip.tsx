"use client";

import { useLayoutEffect, useRef, useState } from "react";

const TOOLTIP_WIDTH = 224;
const VIEWPORT_MARGIN = 8;

/**
 * Positioned via measured coordinates + `position: fixed`, not CSS centering
 * — a plain `left-1/2 -translate-x-1/2` absolute box escaped/clipped
 * unpredictably inside a scrollable <dialog>, depending on where the icon
 * sat relative to the dialog's edges. `fixed` positioning (computed from
 * getBoundingClientRect, clamped to the viewport) escapes the dialog's own
 * overflow/clipping model entirely, so it always renders fully on-screen.
 */
export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const idealLeft = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    const maxLeft = window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN;
    const left = Math.min(Math.max(idealLeft, VIEWPORT_MARGIN), maxLeft);

    setPosition({ top: rect.bottom + 8, left });
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={text}
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        className="flex size-4 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-semibold leading-none text-muted transition-colors hover:border-primary hover:text-foreground"
      >
        !
      </button>
      {open && position && (
        <span
          role="tooltip"
          style={{ top: position.top, left: position.left, width: TOOLTIP_WIDTH }}
          className="fixed z-50 rounded-lg border border-border bg-surface p-2 text-xs text-foreground shadow-lg"
        >
          {text}
        </span>
      )}
    </>
  );
}

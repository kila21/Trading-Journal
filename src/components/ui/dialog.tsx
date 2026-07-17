"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Only ever mount this component when it should be visible — the parent is
 * responsible for conditional rendering, not an `open` prop. Letting mount/
 * unmount be the single source of truth (instead of imperatively syncing an
 * `open` boolean against the native <dialog>'s own open/close state across
 * re-renders) avoids a real bug hit here: the dialog could get out of sync
 * with its prop and simply never show again after a close.
 */
export function Dialog({
  onClose,
  children,
  className,
}: {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "m-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 text-foreground backdrop:bg-black/60",
        className,
      )}
    >
      {children}
    </dialog>
  );
}

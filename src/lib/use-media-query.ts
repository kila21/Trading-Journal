"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a CSS media query via useSyncExternalStore. SSR-safe: the server
 * snapshot is always `false`, so the first client render matches (no hydration
 * mismatch), then it syncs to the real value. Use for layout branches that
 * must not run during SSR, where there is no viewport — e.g. desktop table vs.
 * mobile card list.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

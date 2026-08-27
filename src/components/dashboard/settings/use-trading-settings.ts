"use client";

import { useCallback, useEffect, useState } from "react";
import type { TradingSettingsDTO } from "@/types/trading-settings";

/** Fetches the current user's trading settings. Mirrors use-setups.ts. */
export function useTradingSettings() {
  const [settings, setSettings] = useState<TradingSettingsDTO | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/trading-settings")
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        setSettings(ok ? (body.settings as TradingSettingsDTO | null) : null);
        setError(!ok);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setSettings(null);
        setError(true);
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refetch = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  return { settings, isLoading: !loaded, error, refetch };
}

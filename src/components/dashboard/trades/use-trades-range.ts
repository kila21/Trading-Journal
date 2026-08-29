"use client";

import { useCallback, useEffect, useState } from "react";
import type { TradeDTO } from "@/types/trade";
import { normalizeTrades } from "./normalize-trade";

export type AnalyticsRange = "month" | "90d" | "ytd" | "all";

/** Analytics page's data hook — mirrors useMonthTrades, but keyed off a preset range instead of a navigable month. */
export function useTradesRange(range: AnalyticsRange) {
  const [trades, setTrades] = useState<TradeDTO[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const key = `${range}-${refreshKey}`;

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/trades?range=${range}`)
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        setTrades(ok ? normalizeTrades(body.trades) : []);
        setError(!ok);
        setLoadedKey(key);
      })
      .catch(() => {
        if (cancelled) return;
        setTrades([]);
        setError(true);
        setLoadedKey(key);
      });

    return () => {
      cancelled = true;
    };
  }, [key, range]);

  const refetch = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  return { trades, isLoading: loadedKey !== key, error, refetch };
}

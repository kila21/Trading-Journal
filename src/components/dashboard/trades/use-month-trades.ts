"use client";

import { useCallback, useEffect, useState } from "react";
import type { TradeDTO } from "@/types/trade";
import { normalizeTrades } from "./normalize-trade";

export function useMonthTrades(year: number, month: number) {
  const [trades, setTrades] = useState<TradeDTO[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const key = `${year}-${month}-${refreshKey}`;

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/trades?year=${year}&month=${month}`)
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
  }, [key, year, month]);

  const refetch = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  return { trades, isLoading: loadedKey !== key, error, refetch };
}

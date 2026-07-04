"use client";

import { useCallback, useEffect, useState } from "react";

export interface TradeDTO {
  id: string;
  symbol: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  takeProfit: number | null;
  stopLoss: number | null;
  size: number;
  pnl: number;
  tradeDate: string;
  notes: string | null;
}

export function useMonthTrades(year: number, month: number) {
  const [trades, setTrades] = useState<TradeDTO[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const key = `${year}-${month}-${refreshKey}`;

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/trades?year=${year}&month=${month}`)
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        setTrades(ok ? (body.trades as TradeDTO[]) : []);
        setLoadedKey(key);
      });

    return () => {
      cancelled = true;
    };
  }, [key, year, month]);

  const refetch = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  return { trades, isLoading: loadedKey !== key, refetch };
}

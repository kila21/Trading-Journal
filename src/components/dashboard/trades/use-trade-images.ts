"use client";

import { useCallback, useEffect, useState } from "react";
import type { TradeTimeframe } from "@/config/trade-timeframes";

export interface TradeImageDTO {
  id: string;
  timeframe: TradeTimeframe;
  caption: string | null;
  url: string;
}

export function useTradeImages(tradeId: string) {
  const [images, setImages] = useState<TradeImageDTO[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const key = `${tradeId}-${refreshKey}`;

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/trades/${tradeId}/images`)
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        setImages(ok ? (body.images as TradeImageDTO[]) : []);
        setLoadedKey(key);
      });

    return () => {
      cancelled = true;
    };
  }, [key, tradeId]);

  const refetch = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  return { images, isLoading: loadedKey !== key, refetch };
}

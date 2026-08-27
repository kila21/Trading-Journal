"use client";

import { useCallback, useEffect, useState } from "react";
import type { TradeImageDTO } from "@/types/trade";

export function useTradeImages(tradeId: string) {
  const [images, setImages] = useState<TradeImageDTO[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const key = `${tradeId}-${refreshKey}`;

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/trades/${tradeId}/images`)
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        setImages(ok ? (body.images as TradeImageDTO[]) : []);
        setError(!ok);
        setLoadedKey(key);
      })
      .catch(() => {
        if (cancelled) return;
        setImages([]);
        setError(true);
        setLoadedKey(key);
      });

    return () => {
      cancelled = true;
    };
  }, [key, tradeId]);

  const refetch = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  return { images, isLoading: loadedKey !== key, error, refetch };
}

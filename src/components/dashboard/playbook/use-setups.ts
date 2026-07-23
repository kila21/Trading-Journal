"use client";

import { useCallback, useEffect, useState } from "react";
import type { SetupDTO } from "@/types/setup";

/** Fetches the current user's playbook. Not range-scoped — mirrors useTradesRange minus the range param. */
export function useSetups() {
  const [setups, setSetups] = useState<SetupDTO[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/setups")
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        setSetups(ok ? (body.setups as SetupDTO[]) : []);
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refetch = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  return { setups, isLoading: !loaded, refetch };
}

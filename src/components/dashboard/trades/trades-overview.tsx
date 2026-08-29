"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useTradesRange, type AnalyticsRange } from "./use-trades-range";
import { applyTradeFilters, computeTradesSummary, defaultTradeFilters, sortTrades } from "./trade-filters";
import type { TradeFilters, TradeSortField, TradeSortDirection } from "./trade-filters";
import { TradesFilterBar } from "./trades-filter-bar";
import { TradesTable } from "./trades-table";
import { TradesCardList } from "./trades-card-list";
import { TradesTableSkeleton } from "./trades-table-skeleton";
import { useMediaQuery } from "@/lib/use-media-query";
import { TradesEmptyState } from "./trades-empty-state";
import { tradesToCsv } from "./trade-csv";
import { ErrorState } from "@/components/ui/error-state";
import type { TradeDTO } from "@/types/trade";

export function TradesOverview() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [range, setRange] = useState<AnalyticsRange>("all");
  const [filters, setFilters] = useState<TradeFilters>(defaultTradeFilters);
  const [sortField, setSortField] = useState<TradeSortField>("tradeDate");
  const [sortDirection, setSortDirection] = useState<TradeSortDirection>("desc");

  const { trades, isLoading, error, refetch } = useTradesRange(range);
  // Derived without an effect so a range change never re-shows the full skeleton.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  if (!isLoading && !hasLoadedOnce) setHasLoadedOnce(true);

  const filteredTrades = useMemo(() => applyTradeFilters(trades, filters), [trades, filters]);
  const sortedTrades = useMemo(
    () => sortTrades(filteredTrades, sortField, sortDirection),
    [filteredTrades, sortField, sortDirection],
  );
  const summary = useMemo(() => computeTradesSummary(sortedTrades), [sortedTrades]);

  function handleSort(field: TradeSortField) {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  function handleSortChange(field: TradeSortField, direction: TradeSortDirection) {
    setSortField(field);
    setSortDirection(direction);
  }

  function handleAddTrade() {
    router.push("/dashboard/trades/new");
  }

  function handleRowClick(trade: TradeDTO) {
    router.push(`/dashboard/trades/${trade.id}`);
  }

  function handleExport() {
    const csv = tradesToCsv(sortedTrades);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 p-6">
      <TradesFilterBar
        range={range}
        onRangeChange={setRange}
        trades={trades}
        filters={filters}
        onFiltersChange={setFilters}
        onAddTrade={handleAddTrade}
        onExport={handleExport}
      />

      {error ? (
        <ErrorState message={t("loadError")} retryLabel={t("retry")} onRetry={refetch} />
      ) : !hasLoadedOnce && isLoading ? (
        <TradesTableSkeleton />
      ) : sortedTrades.length === 0 ? (
        <TradesEmptyState trades={trades} filters={filters} onChange={setFilters} />
      ) : isDesktop ? (
        <TradesTable
          trades={sortedTrades}
          summary={summary}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRowClick={handleRowClick}
        />
      ) : (
        <TradesCardList
          trades={sortedTrades}
          summary={summary}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onRowClick={handleRowClick}
        />
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useTradesRange, type AnalyticsRange } from "./use-trades-range";
import { applyTradeFilters, computeTradesSummary, defaultTradeFilters, sortTrades } from "./trade-filters";
import type { TradeFilters, TradeSortField, TradeSortDirection } from "./trade-filters";
import { TradesFilterBar } from "./trades-filter-bar";
import { TradesTable } from "./trades-table";
import { TradesEmptyState } from "./trades-empty-state";
import { TradeFormModal } from "./trade-form-modal";
import { TradeDetailModal } from "./trade-detail-modal";
import type { TradeDTO } from "@/types/trade";

export function TradesOverview() {
  const [range, setRange] = useState<AnalyticsRange>("all");
  const [filters, setFilters] = useState<TradeFilters>(defaultTradeFilters);
  const [sortField, setSortField] = useState<TradeSortField>("tradeDate");
  const [sortDirection, setSortDirection] = useState<TradeSortDirection>("desc");

  const { trades, refetch } = useTradesRange(range);

  const [modal, setModal] = useState<"form" | "detail" | null>(null);
  const [editingTrade, setEditingTrade] = useState<TradeDTO | undefined>(undefined);
  const [detailTrade, setDetailTrade] = useState<TradeDTO | undefined>(undefined);

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

  function handleAddTrade() {
    setEditingTrade(undefined);
    setModal("form");
  }

  function handleEditTrade(trade: TradeDTO) {
    setEditingTrade(trade);
    setModal("form");
  }

  function handleRowClick(trade: TradeDTO) {
    setDetailTrade(trade);
    setModal("detail");
  }

  function handleCloseModal() {
    setModal(null);
    setEditingTrade(undefined);
    setDetailTrade(undefined);
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
      />

      {sortedTrades.length === 0 ? (
        <TradesEmptyState trades={trades} filters={filters} onChange={setFilters} />
      ) : (
        <TradesTable
          trades={sortedTrades}
          summary={summary}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRowClick={handleRowClick}
        />
      )}

      {modal === "form" && (
        <TradeFormModal date={new Date()} trade={editingTrade} onClose={handleCloseModal} onSaved={refetch} />
      )}
      {modal === "detail" && detailTrade && (
        <TradeDetailModal
          trade={detailTrade}
          onClose={handleCloseModal}
          onEdit={() => handleEditTrade(detailTrade)}
        />
      )}
    </div>
  );
}

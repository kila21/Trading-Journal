"use client";

import { useTranslations } from "next-intl";
import { FilterIcon } from "@/components/dashboard/icons";
import { applyTradeFilters, type TradeFilters } from "./trade-filters";
import type { TradeDTO } from "@/types/trade";

interface ActiveDimension {
  label: string;
  reset: Partial<TradeFilters>;
}

export function TradesEmptyState({
  trades,
  filters,
  onChange,
}: {
  trades: TradeDTO[];
  filters: TradeFilters;
  onChange: (next: TradeFilters) => void;
}) {
  const t = useTranslations("dashboard");

  const dimensions: ActiveDimension[] = [];
  if (filters.search.trim() !== "") {
    dimensions.push({ label: `"${filters.search.trim()}"`, reset: { search: "" } });
  }
  if (filters.symbols.length > 0) {
    dimensions.push({ label: t("symbolLabel"), reset: { symbols: [] } });
  }
  if (filters.directions.length > 0) {
    dimensions.push({ label: t("directionLabel"), reset: { directions: [] } });
  }
  if (filters.setups.length > 0 || filters.includeNoSetup) {
    dimensions.push({ label: t("setupLabel"), reset: { setups: [], includeNoSetup: false } });
  }
  if (filters.sessions.length > 0 || filters.includeNoSession) {
    dimensions.push({ label: t("tableSession"), reset: { sessions: [], includeNoSession: false } });
  }
  if (filters.mistakeTags.length > 0) {
    dimensions.push({ label: t("mistakeTagsLabel"), reset: { mistakeTags: [] } });
  }
  if (filters.followedPlan !== "any") {
    dimensions.push({ label: t("followedPlan"), reset: { followedPlan: "any" } });
  }
  if (filters.outcomes.length > 0) {
    dimensions.push({ label: t("filterOutcome"), reset: { outcomes: [] } });
  }

  const suggestions = dimensions
    .map((dimension) => ({
      ...dimension,
      count: applyTradeFilters(trades, { ...filters, ...dimension.reset }).length,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
      <FilterIcon className="size-8 text-muted" />
      <p className="text-sm font-medium text-foreground">
        {suggestions.length > 0 ? t("tradesEmptyTitle") : t("noTradesYet")}
      </p>
      {suggestions.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => onChange({ ...filters, ...suggestion.reset })}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {t("clearFilterCount", { label: suggestion.label, count: suggestion.count })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatShortDate, toLocale } from "@/components/dashboard/calendar/format-date";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { TrendUpIcon, TrendDownIcon, WarningIcon } from "@/components/dashboard/icons";
import { getTradingSession, sessionTranslationKeys } from "./trading-session";
import { computeAchievedR, formatRMultiple } from "./trade-stats";
import type { TradeSortField, TradeSortDirection, TradesSummary } from "./trade-filters";
import type { TradeDTO } from "@/types/trade";

const SORT_OPTIONS: { field: TradeSortField; direction: TradeSortDirection }[] = [
  { field: "tradeDate", direction: "desc" },
  { field: "tradeDate", direction: "asc" },
  { field: "pnl", direction: "desc" },
  { field: "pnl", direction: "asc" },
  { field: "achievedR", direction: "desc" },
  { field: "achievedR", direction: "asc" },
];

/**
 * Phone layout for the trades list — a stacked card per trade instead of the
 * horizontally-scrolling desktop table. Not virtualized: the set is already
 * bounded by the range tab + filters, and this is a single-user journal.
 */
export function TradesCardList({
  trades,
  summary,
  sortField,
  sortDirection,
  onSortChange,
  onRowClick,
}: {
  trades: TradeDTO[];
  summary: TradesSummary;
  sortField: TradeSortField;
  sortDirection: TradeSortDirection;
  onSortChange: (field: TradeSortField, direction: TradeSortDirection) => void;
  onRowClick: (trade: TradeDTO) => void;
}) {
  const t = useTranslations("dashboard");
  const locale = toLocale(useLocale());

  const sortLabel = (field: TradeSortField, direction: TradeSortDirection) => {
    const base =
      field === "tradeDate" ? t("sortByDate") : field === "pnl" ? t("sortByPnl") : t("sortByR");
    return `${base} · ${direction === "asc" ? t("sortAscending") : t("sortDescending")}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <label htmlFor="mobile-sort" className="text-xs text-muted">
          {t("sortByLabel")}
        </label>
        <select
          id="mobile-sort"
          value={`${sortField}:${sortDirection}`}
          onChange={(event) => {
            const [field, direction] = event.target.value.split(":") as [
              TradeSortField,
              TradeSortDirection,
            ];
            onSortChange(field, direction);
          }}
          className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={`${option.field}:${option.direction}`} value={`${option.field}:${option.direction}`}>
              {sortLabel(option.field, option.direction)}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-2">
        {trades.map((trade) => {
          const session = getTradingSession(new Date(trade.tradeDate));
          const achievedR = computeAchievedR(trade);
          const isProfit = trade.pnl >= 0;
          const date = new Date(trade.tradeDate);
          return (
            <li key={trade.id}>
              <button
                type="button"
                onClick={() => onRowClick(trade)}
                className="flex w-full flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:bg-background/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                    {trade.direction === "long" ? (
                      <TrendUpIcon className="size-3.5 shrink-0 text-success" />
                    ) : (
                      <TrendDownIcon className="size-3.5 shrink-0 text-danger" />
                    )}
                    {trade.symbol}
                  </span>
                  <span className={cn("text-base font-semibold", isProfit ? "text-success" : "text-danger")}>
                    {formatPnl(trade.pnl)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span>{`${formatShortDate(date, locale)}, ${date.getFullYear()}`}</span>
                  <span aria-hidden>·</span>
                  <span>{session ? t(sessionTranslationKeys[session.name]) : t("noActiveSession")}</span>
                  <span aria-hidden>·</span>
                  <span>{achievedR === null ? "—" : formatRMultiple(achievedR)}</span>
                  <span aria-hidden>·</span>
                  <span className={trade.setup ? "text-foreground" : undefined}>
                    {trade.setup ?? t("setupNone")}
                  </span>
                  {trade.mistakeTags.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 rounded-full border border-danger/30 bg-danger/15 px-1.5 py-0.5 font-medium text-danger">
                      <WarningIcon className="size-3" />
                      {trade.mistakeTags.length}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between rounded-xl border border-border bg-background/30 p-4 text-sm">
        <span className="text-muted">
          {t("netPnlSecondary", { count: summary.count, rate: summary.winRate ?? 0 })}
        </span>
        <span className="flex items-center gap-3">
          <span className="text-muted">
            {summary.avgAchievedR === null ? "—" : formatRMultiple(summary.avgAchievedR)}
          </span>
          <span className={cn("font-semibold", summary.totalPnl >= 0 ? "text-success" : "text-danger")}>
            {formatPnl(summary.totalPnl)}
          </span>
        </span>
      </div>
    </div>
  );
}

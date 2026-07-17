"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatShortDate, toLocale } from "@/components/dashboard/calendar/format-date";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { TrendUpIcon, TrendDownIcon, WarningIcon, ChevronDownIcon } from "@/components/dashboard/icons";
import { getTradingSession, sessionTranslationKeys } from "./trading-session";
import { computeAchievedR, formatRMultiple } from "./trade-stats";
import type { TradeSortField, TradeSortDirection, TradesSummary } from "./trade-filters";
import type { TradeDTO } from "@/types/trade";

function formatTableDate(date: Date, locale: "en" | "ka"): string {
  return `${formatShortDate(date, locale)}, ${date.getFullYear()}`;
}

function SortableHeader({
  field,
  label,
  align,
  sortField,
  sortDirection,
  onSort,
}: {
  field: TradeSortField;
  label: string;
  align?: "right";
  sortField: TradeSortField;
  sortDirection: TradeSortDirection;
  onSort: (field: TradeSortField) => void;
}) {
  const isActive = sortField === field;
  return (
    <th className={cn("px-4 py-3 font-medium text-muted", align === "right" ? "text-right" : "text-left")}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          isActive && "text-foreground",
        )}
      >
        {label}
        <ChevronDownIcon
          className={cn(
            "size-3.5 transition-transform",
            isActive && sortDirection === "asc" && "rotate-180",
            !isActive && "opacity-30",
          )}
        />
      </button>
    </th>
  );
}

export function TradesTable({
  trades,
  summary,
  sortField,
  sortDirection,
  onSort,
  onRowClick,
}: {
  trades: TradeDTO[];
  summary: TradesSummary;
  sortField: TradeSortField;
  sortDirection: TradeSortDirection;
  onSort: (field: TradeSortField) => void;
  onRowClick: (trade: TradeDTO) => void;
}) {
  const t = useTranslations("dashboard");
  const locale = toLocale(useLocale());

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-border">
          <tr>
            <SortableHeader
              field="tradeDate"
              label={t("tableDate")}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <th className="px-4 py-3 text-left font-medium text-muted">{t("tableSymbol")}</th>
            <th className="px-4 py-3 text-left font-medium text-muted">{t("tableSetup")}</th>
            <th className="px-4 py-3 text-left font-medium text-muted">{t("tableSession")}</th>
            <SortableHeader
              field="achievedR"
              label={t("tableR")}
              align="right"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              field="pnl"
              label={t("tablePnl")}
              align="right"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => {
            const session = getTradingSession(new Date(trade.tradeDate));
            const achievedR = computeAchievedR(trade);
            const isProfit = trade.pnl >= 0;
            return (
              <tr
                key={trade.id}
                onClick={() => onRowClick(trade)}
                className="cursor-pointer border-b border-border last:border-b-0 hover:bg-background/40"
              >
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {formatTableDate(new Date(trade.tradeDate), locale)}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    {trade.direction === "long" ? (
                      <TrendUpIcon className="size-3.5 shrink-0 text-success" />
                    ) : (
                      <TrendDownIcon className="size-3.5 shrink-0 text-danger" />
                    )}
                    {trade.symbol}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={trade.setup ? "text-foreground" : "text-muted"}>
                      {trade.setup ?? t("setupNone")}
                    </span>
                    {trade.mistakeTags.length > 0 && (
                      <span
                        title={trade.mistakeTags.join(", ")}
                        className="inline-flex items-center gap-0.5 rounded-full border border-danger/30 bg-danger/15 px-1.5 py-0.5 text-xs font-medium text-danger"
                      >
                        <WarningIcon className="size-3" />
                        {trade.mistakeTags.length}
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {session ? t(sessionTranslationKeys[session.name]) : t("noActiveSession")}
                </td>
                <td className="px-4 py-3 text-right text-muted">
                  {achievedR === null ? "—" : formatRMultiple(achievedR)}
                </td>
                <td className={cn("px-4 py-3 text-right font-semibold", isProfit ? "text-success" : "text-danger")}>
                  {formatPnl(trade.pnl)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t border-border bg-background/30">
          <tr>
            <td colSpan={4} className="px-4 py-3 text-muted">
              {t("netPnlSecondary", { count: summary.count, rate: summary.winRate ?? 0 })}
            </td>
            <td className="px-4 py-3 text-right text-muted">
              {summary.avgAchievedR === null ? "—" : formatRMultiple(summary.avgAchievedR)}
            </td>
            <td
              className={cn(
                "px-4 py-3 text-right font-semibold",
                summary.totalPnl >= 0 ? "text-success" : "text-danger",
              )}
            >
              {formatPnl(summary.totalPnl)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

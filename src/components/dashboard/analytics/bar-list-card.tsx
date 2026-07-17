"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { BarTrack } from "@/components/ui/bar-track";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { cn } from "@/lib/utils";

export interface BarListRow {
  key: string;
  label: string;
  trades: number;
  winRate: number; // 0..1
  totalPnl: number;
}

const ROW_GRID = "grid grid-cols-[minmax(0,1.4fr)_52px_44px_minmax(0,1.6fr)_84px] items-center gap-4";

/** Shared "ranked bar list" card shape — used for performance-by-setup and performance-by-session. */
export function BarListCard({
  title,
  labelHeader,
  rows,
  emptyMessage,
}: {
  title: string;
  labelHeader: string;
  rows: BarListRow[];
  emptyMessage: string;
}) {
  const t = useTranslations("dashboard");
  const maxAbsPnl = Math.max(1, ...rows.map((row) => Math.abs(row.totalPnl)));

  return (
    <Card>
      <h2 className="text-lg font-semibold">{title}</h2>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className={cn(ROW_GRID, "text-xs text-muted")}>
            <span>{labelHeader}</span>
            <span>{t("tableTrades")}</span>
            <span>{t("tableWinRate")}</span>
            <span />
            <span className="text-right">{t("tableTotalPnl")}</span>
          </div>
          {rows.map((row) => (
            <div key={row.key} className={ROW_GRID}>
              <span className="truncate text-sm font-medium text-foreground">{row.label}</span>
              <span className="text-sm text-muted">{row.trades}</span>
              <span className="text-sm text-muted">{Math.round(row.winRate * 100)}%</span>
              <BarTrack
                percent={(Math.abs(row.totalPnl) / maxAbsPnl) * 100}
                tone={row.totalPnl >= 0 ? "success" : "danger"}
              />
              <span
                className={cn(
                  "text-right text-sm font-semibold",
                  row.totalPnl >= 0 ? "text-success" : "text-danger",
                )}
              >
                {formatPnl(row.totalPnl)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

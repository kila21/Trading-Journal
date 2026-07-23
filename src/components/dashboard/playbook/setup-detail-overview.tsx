"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/dashboard/overview/stat-tile";
import { ChevronLeftIcon } from "@/components/dashboard/icons";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { formatRMultiple } from "@/components/dashboard/trades/trade-stats";
import { useTradesRange } from "@/components/dashboard/trades/use-trades-range";
import { computeTradesSummary } from "@/components/dashboard/trades/trade-filters";
import { useSetups } from "./use-setups";
import { SetupFormModal } from "./setup-form-modal";
import { statusLabelKey, statusToneClass } from "./setup-card";
import {
  computeConditionBreakdown,
  computeConditionComplianceSplit,
  type ConditionComplianceGroup,
  type ConditionStatRow,
} from "./setup-condition-stats";
import { cn } from "@/lib/utils";

function CompliancePanel({
  label,
  group,
  tone,
}: {
  label: string;
  group: ConditionComplianceGroup;
  tone: "success" | "warning";
}) {
  const t = useTranslations("dashboard");
  const classes =
    tone === "success"
      ? { border: "border-success/20 bg-success/10", text: "text-success", textMuted: "text-success/70" }
      : { border: "border-warning/20 bg-warning/10", text: "text-warning", textMuted: "text-warning/70" };

  return (
    <div className={cn("rounded-xl border p-4", classes.border)}>
      <p className={cn("text-sm font-medium", classes.text)}>{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", classes.text)}>{formatPnl(group.totalPnl)}</p>
      <p className={cn("mt-0.5 text-xs", classes.textMuted)}>
        {group.trades === 0
          ? t("noTradesYet")
          : t("tradesWinRateSecondary", { count: group.trades, rate: Math.round((group.winRate ?? 0) * 100) })}
      </p>
    </div>
  );
}

function ConditionRow({ row }: { row: ConditionStatRow }) {
  const t = useTranslations("dashboard");

  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-sm font-medium text-foreground">{row.condition}</p>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-success/10 px-3 py-2">
          <p className="text-xs font-medium text-success">{t("conditionChecked")}</p>
          <p className="mt-0.5 text-xs text-muted">
            {row.checkedTrades === 0
              ? t("noTradesYet")
              : t("tradesWinRateSecondary", { count: row.checkedTrades, rate: Math.round((row.checkedWinRate ?? 0) * 100) })}
          </p>
        </div>
        <div className="rounded-lg bg-warning/10 px-3 py-2">
          <p className="text-xs font-medium text-warning">{t("conditionSkipped")}</p>
          <p className="mt-0.5 text-xs text-muted">
            {row.uncheckedTrades === 0
              ? t("noTradesYet")
              : t("tradesWinRateSecondary", {
                  count: row.uncheckedTrades,
                  rate: Math.round((row.uncheckedWinRate ?? 0) * 100),
                })}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SetupDetailOverview({ id }: { id: string }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { setups, isLoading, refetch } = useSetups();
  const { trades } = useTradesRange("all");
  const [editing, setEditing] = useState(false);

  const setup = setups.find((s) => s.id === id);

  const setupTrades = useMemo(
    () => (setup ? trades.filter((trade) => trade.setup === setup.name) : []),
    [trades, setup],
  );
  const summary = useMemo(() => computeTradesSummary(setupTrades), [setupTrades]);
  const complianceSplit = useMemo(
    () => (setup ? computeConditionComplianceSplit(setupTrades, setup.conditions) : null),
    [setupTrades, setup],
  );
  const conditionBreakdown = useMemo(
    () => (setup ? computeConditionBreakdown(setupTrades, setup.conditions) : []),
    [setupTrades, setup],
  );

  const backLink = (
    <Link href="/dashboard/playbook" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
      <ChevronLeftIcon className="size-4" />
      {t("backToPlaybook")}
    </Link>
  );

  if (!setup) {
    return (
      <div className="space-y-4 p-6">
        {backLink}
        {!isLoading && <p className="text-sm text-muted">{t("setupNotFound")}</p>}
      </div>
    );
  }

  const showConditionSections = setup.conditions.length > 0 && setupTrades.length > 0;

  return (
    <div className="space-y-6 p-6">
      {backLink}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{setup.name}</h1>
            <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", statusToneClass[setup.status])}>
              {t(statusLabelKey[setup.status])}
            </span>
          </div>
          {setup.description && <p className="mt-1 max-w-xl text-sm text-muted">{setup.description}</p>}
        </div>
        <Button type="button" variant="outline" onClick={() => setEditing(true)}>
          {t("editSetup")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label={t("tableTrades")} value={String(summary.count)} />
        <StatTile
          label={t("tableWinRate")}
          value={summary.winRate === null ? "—" : `${summary.winRate}%`}
          tone={summary.winRate === null ? "neutral" : summary.winRate >= 50 ? "success" : "danger"}
        />
        <StatTile
          label={t("avgAchievedR")}
          value={summary.avgAchievedR === null ? "—" : formatRMultiple(summary.avgAchievedR)}
        />
        <StatTile
          label={t("tableTotalPnl")}
          value={formatPnl(summary.totalPnl)}
          tone={summary.totalPnl === 0 ? "neutral" : summary.totalPnl > 0 ? "success" : "danger"}
        />
      </div>

      {showConditionSections && complianceSplit && (
        <Card>
          <h2 className="text-lg font-semibold">{t("conditionComplianceTitle")}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CompliancePanel label={t("allConditionsMet")} group={complianceSplit.allMet} tone="success" />
            <CompliancePanel label={t("partialConditionsMet")} group={complianceSplit.partial} tone="warning" />
          </div>
        </Card>
      )}

      {showConditionSections && (
        <Card>
          <h2 className="text-lg font-semibold">{t("conditionBreakdownTitle")}</h2>
          <div className="mt-4 space-y-3">
            {conditionBreakdown.map((row) => (
              <ConditionRow key={row.condition} row={row} />
            ))}
          </div>
        </Card>
      )}

      {editing && (
        <SetupFormModal
          setup={setup}
          onClose={() => setEditing(false)}
          onSaved={refetch}
          onDeleted={() => router.push("/dashboard/playbook")}
        />
      )}
    </div>
  );
}

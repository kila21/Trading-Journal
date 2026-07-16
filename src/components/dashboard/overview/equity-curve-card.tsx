"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { EquityCurveChart } from "@/components/ui/equity-curve-chart";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { computeEquityCurve } from "@/components/dashboard/trades/trade-stats";
import type { TradeDTO } from "@/types/trade";

export function EquityCurveCard({ trades }: { trades: TradeDTO[] }) {
  const t = useTranslations("dashboard");
  const data = useMemo(() => computeEquityCurve(trades), [trades]);

  return (
    <Card>
      <h2 className="text-lg font-semibold">{t("equityCurve")}</h2>
      <div className="mt-4">
        <EquityCurveChart
          data={data}
          formatValue={formatPnl}
          pointLabel={(point) => t("tradeSequence", { count: point })}
          emptyMessage={t("noTradesYet")}
        />
      </div>
    </Card>
  );
}

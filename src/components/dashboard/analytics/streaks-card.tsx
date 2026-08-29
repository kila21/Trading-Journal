"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/dashboard/overview/stat-tile";
import type { ConsecutiveStreaks } from "@/types/trade";

export function StreaksCard({ streaks }: { streaks: ConsecutiveStreaks }) {
  const t = useTranslations("dashboard");

  return (
    <Card>
      <h2 className="text-lg font-semibold">{t("streaksTitle")}</h2>
      <p className="mt-1 text-xs text-muted">{t("streaksHint")}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label={t("maxWinStreak")}
          value={String(streaks.maxWins)}
          tone={streaks.maxWins > 0 ? "success" : "neutral"}
        />
        <StatTile
          label={t("maxLossStreak")}
          value={String(streaks.maxLosses)}
          tone={streaks.maxLosses > 0 ? "danger" : "neutral"}
        />
        <StatTile
          label={t("currentStreakLabel")}
          value={
            streaks.current === null
              ? "—"
              : t(streaks.current.type === "win" ? "streakCurrentWins" : "streakCurrentLosses", {
                  count: streaks.current.count,
                })
          }
          tone={
            streaks.current === null ? "neutral" : streaks.current.type === "win" ? "success" : "danger"
          }
        />
      </div>
    </Card>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { sessionTranslationKeys } from "@/components/dashboard/trades/trading-session";
import type { SetupDTO } from "@/types/setup";
import type { SessionName } from "@/types/trading-session";

const statusToneClass: Record<SetupDTO["status"], string> = {
  active: "border-success/30 bg-success/15 text-success",
  testing: "border-warning/30 bg-warning/15 text-warning",
  retired: "border-border bg-background/60 text-muted",
};

export function SetupCard({ setup, onClick }: { setup: SetupDTO; onClick: () => void }) {
  const t = useTranslations("dashboard");
  const statusLabelKey: Record<SetupDTO["status"], string> = {
    active: "setupStatusActive",
    testing: "setupStatusTesting",
    retired: "setupStatusRetired",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground">{setup.name}</h3>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
            statusToneClass[setup.status],
          )}
        >
          {t(statusLabelKey[setup.status])}
        </span>
      </div>

      {setup.description && <p className="line-clamp-2 text-sm text-muted">{setup.description}</p>}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
          {t("setupConditionCount", { count: setup.conditions.length })}
        </span>
        {setup.minR !== null && (
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            {t("setupMinRBadge", { value: setup.minR })}
          </span>
        )}
        {setup.sessions.map((session) => (
          <span key={session} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            {t(sessionTranslationKeys[session as SessionName])}
          </span>
        ))}
        {setup.instruments.map((instrument) => (
          <span key={instrument} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            {instrument}
          </span>
        ))}
      </div>
    </button>
  );
}

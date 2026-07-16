"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type OverviewView = "calendar" | "equity";

export function ViewToggle({ value, onChange }: { value: OverviewView; onChange: (view: OverviewView) => void }) {
  const t = useTranslations("dashboard");

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
      {(["calendar", "equity"] as const).map((view) => (
        <button
          key={view}
          type="button"
          onClick={() => onChange(view)}
          aria-pressed={value === view}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            value === view ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
          )}
        >
          {t(view === "calendar" ? "viewCalendar" : "equityCurve")}
        </button>
      ))}
    </div>
  );
}

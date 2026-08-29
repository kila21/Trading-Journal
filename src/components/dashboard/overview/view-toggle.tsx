"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type OverviewView = "calendar" | "agenda" | "equity";

const VIEW_KEYS: Record<OverviewView, string> = {
  calendar: "viewCalendar",
  agenda: "viewAgenda",
  equity: "equityCurve",
};

export function ViewToggle({ value, onChange }: { value: OverviewView; onChange: (view: OverviewView) => void }) {
  const t = useTranslations("dashboard");

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
      {(["calendar", "agenda", "equity"] as const).map((view) => (
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
          {t(VIEW_KEYS[view])}
        </button>
      ))}
    </div>
  );
}

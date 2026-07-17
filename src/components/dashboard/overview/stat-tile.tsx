import { WarningIcon } from "@/components/dashboard/icons";
import { cn } from "@/lib/utils";

const toneClass = {
  success: "text-success",
  danger: "text-danger",
  neutral: "text-foreground",
} as const;

export function StatTile({
  label,
  value,
  secondary,
  warning,
  tone = "neutral",
}: {
  label: string;
  value: string;
  secondary?: string;
  // Takes over the secondary-line slot when present — e.g. "Low sample" on
  // a ratio stat that isn't reliable yet with only a handful of trades.
  warning?: string;
  tone?: keyof typeof toneClass;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold sm:text-2xl", toneClass[tone])}>{value}</p>
      {warning ? (
        <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-warning">
          <WarningIcon className="size-3.5 shrink-0" />
          {warning}
        </p>
      ) : (
        secondary && <p className="mt-0.5 text-xs text-muted">{secondary}</p>
      )}
    </div>
  );
}

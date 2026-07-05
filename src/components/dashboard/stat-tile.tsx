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
  tone = "neutral",
}: {
  label: string;
  value: string;
  secondary?: string;
  tone?: keyof typeof toneClass;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold sm:text-2xl", toneClass[tone])}>{value}</p>
      {secondary && <p className="mt-0.5 text-xs text-muted">{secondary}</p>}
    </div>
  );
}

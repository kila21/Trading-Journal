import { cn } from "@/lib/utils";

/** A thin rounded track with a colored fill — the bar mark used by the cost-by-mistake breakdown. */
export function BarTrack({ percent, tone }: { percent: number; tone: "success" | "danger" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border/40">
      <div
        className={cn("h-full rounded-full", tone === "success" ? "bg-success" : "bg-danger")}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

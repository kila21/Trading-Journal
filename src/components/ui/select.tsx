import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

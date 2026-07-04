import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

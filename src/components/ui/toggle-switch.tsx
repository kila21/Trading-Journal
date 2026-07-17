import { cn } from "@/lib/utils";

/** Generic labeled boolean switch — copy-free, no trade-domain knowledge. */
export function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          checked ? "bg-success" : "bg-border",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
      {label && (
        <span className="cursor-pointer text-sm font-medium text-foreground" onClick={() => onChange(!checked)}>
          {label}
        </span>
      )}
    </div>
  );
}

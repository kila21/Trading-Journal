import { cn } from "@/lib/utils";

/**
 * Generic multi-select control rendered as a row of toggleable pill buttons.
 * Copy-free and domain-agnostic on purpose — visual language mirrors the
 * badge/pill pattern already used for direction/session tags elsewhere in
 * the dashboard, so it reads as the same design system, not a new widget.
 */
const toneClass = {
  primary: "border-primary/30 bg-primary/15 text-primary",
  danger: "border-danger/30 bg-danger/15 text-danger",
} as const;

export function ToggleChipGroup<T extends string>({
  options,
  selected,
  onChange,
  getLabel = (option) => option,
  tone = "primary",
}: {
  options: readonly T[];
  selected: T[];
  onChange: (next: T[]) => void;
  getLabel?: (option: T) => string;
  tone?: keyof typeof toneClass;
}) {
  function toggle(option: T) {
    onChange(selected.includes(option) ? selected.filter((s) => s !== option) : [...selected, option]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isSelected}
            onClick={() => toggle(option)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              isSelected ? toneClass[tone] : "border-border text-muted hover:border-primary/40 hover:text-foreground",
            )}
          >
            {getLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

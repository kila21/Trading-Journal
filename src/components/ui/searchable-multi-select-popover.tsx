"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { ChevronDownIcon, SearchIcon } from "@/components/dashboard/icons";

export interface MultiSelectOption<T extends string> {
  value: T;
  label: string;
  count: number;
}

/**
 * Generic searchable multi-select dropdown — copy-free, domain-agnostic.
 * Trigger button + a search-filtered checkbox list, each row showing a live
 * count, plus an optional trailing "bucket" row (e.g. "No setup tagged") for
 * values that don't fit the option list itself. Click-outside-to-close
 * mirrors the pattern already used in src/components/auth/user-menu.tsx.
 */
export function SearchableMultiSelectPopover<T extends string>({
  label,
  options,
  selected,
  onChange,
  searchPlaceholder,
  extraOption,
}: {
  label: string;
  options: MultiSelectOption<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
  searchPlaceholder: string;
  extraOption?: { label: string; count: number; checked: boolean; onChange: (checked: boolean) => void };
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const isActive = selected.length > 0 || extraOption?.checked === true;
  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));

  function toggle(value: T) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          isActive
            ? "border-primary/30 bg-primary/15 text-primary"
            : "border-border text-muted hover:border-primary/40 hover:text-foreground",
        )}
      >
        {label}
        <ChevronDownIcon className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-2 w-72 rounded-lg border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 pl-9"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1.5">
            {filteredOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-background/60"
              >
                <span className="flex items-center gap-2 truncate">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggle(option.value)}
                    className="size-4 shrink-0 rounded border-border accent-primary"
                  />
                  <span className="truncate text-foreground">{option.label}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">{option.count}</span>
              </label>
            ))}
          </div>

          {extraOption && (
            <div className="border-t border-border p-1.5">
              <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-background/60">
                <span className="flex items-center gap-2 truncate">
                  <input
                    type="checkbox"
                    checked={extraOption.checked}
                    onChange={(event) => extraOption.onChange(event.target.checked)}
                    className="size-4 shrink-0 rounded border-border accent-primary"
                  />
                  <span className="truncate text-muted">{extraOption.label}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">{extraOption.count}</span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

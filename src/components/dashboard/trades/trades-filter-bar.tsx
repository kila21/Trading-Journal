"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleChipGroup } from "@/components/ui/toggle-chip-group";
import { SearchableMultiSelectPopover, type MultiSelectOption } from "@/components/ui/searchable-multi-select-popover";
import { SearchIcon, XIcon } from "@/components/dashboard/icons";
import { tradeSetups, type TradeSetup } from "@/config/trade-setups";
import { tradeMistakeTags, type TradeMistakeTag } from "@/config/trade-mistake-tags";
import { tradingSessions } from "@/config/trade-sessions";
import { sessionTranslationKeys } from "./trading-session";
import { computeFilterOptionCounts, defaultTradeFilters, type TradeFilters } from "./trade-filters";
import type { AnalyticsRange } from "./use-trades-range";
import type { TradeDTO } from "@/types/trade";
import type { SessionName } from "@/types/trading-session";
import { cn } from "@/lib/utils";

const RANGES: AnalyticsRange[] = ["month", "90d", "ytd", "all"];
const rangeLabelKey: Record<AnalyticsRange, string> = {
  month: "rangeMonth",
  "90d": "range90d",
  ytd: "rangeYtd",
  all: "rangeAll",
};
const sessionNames = tradingSessions.map((session) => session.name) as SessionName[];
const directionValues = ["long", "short"] as const;
const outcomeValues = ["win", "loss"] as const;

export function TradesFilterBar({
  range,
  onRangeChange,
  trades,
  filters,
  onFiltersChange,
  onAddTrade,
}: {
  range: AnalyticsRange;
  onRangeChange: (range: AnalyticsRange) => void;
  trades: TradeDTO[];
  filters: TradeFilters;
  onFiltersChange: (next: TradeFilters) => void;
  onAddTrade: () => void;
}) {
  const t = useTranslations("dashboard");
  const counts = useMemo(() => computeFilterOptionCounts(trades, filters), [trades, filters]);

  const symbolOptions: MultiSelectOption<string>[] = useMemo(() => {
    const symbols = Array.from(new Set(trades.map((trade) => trade.symbol))).sort();
    return symbols.map((symbol) => ({ value: symbol, label: symbol, count: counts.symbols.get(symbol) ?? 0 }));
  }, [trades, counts.symbols]);

  const setupOptions: MultiSelectOption<TradeSetup>[] = tradeSetups.map((setup) => ({
    value: setup,
    label: setup,
    count: counts.setups.get(setup) ?? 0,
  }));

  const sessionOptions: MultiSelectOption<SessionName>[] = sessionNames.map((name) => ({
    value: name,
    label: t(sessionTranslationKeys[name]),
    count: counts.sessions.get(name) ?? 0,
  }));

  const mistakeTagOptions: MultiSelectOption<TradeMistakeTag>[] = tradeMistakeTags.map((tag) => ({
    value: tag,
    label: tag,
    count: counts.mistakeTags.get(tag) ?? 0,
  }));

  function update(partial: Partial<TradeFilters>) {
    onFiltersChange({ ...filters, ...partial });
  }

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; reset: Partial<TradeFilters> }[] = [];

    for (const symbol of filters.symbols) {
      chips.push({
        key: `symbol-${symbol}`,
        label: symbol,
        reset: { symbols: filters.symbols.filter((value) => value !== symbol) },
      });
    }
    for (const direction of filters.directions) {
      chips.push({
        key: `direction-${direction}`,
        label: direction === "long" ? t("directionLong") : t("directionShort"),
        reset: { directions: filters.directions.filter((value) => value !== direction) },
      });
    }
    for (const setup of filters.setups) {
      chips.push({
        key: `setup-${setup}`,
        label: setup,
        reset: { setups: filters.setups.filter((value) => value !== setup) },
      });
    }
    if (filters.includeNoSetup) {
      chips.push({ key: "no-setup", label: t("noSetupTagged"), reset: { includeNoSetup: false } });
    }
    for (const session of filters.sessions) {
      chips.push({
        key: `session-${session}`,
        label: t(sessionTranslationKeys[session]),
        reset: { sessions: filters.sessions.filter((value) => value !== session) },
      });
    }
    if (filters.includeNoSession) {
      chips.push({ key: "no-session", label: t("noActiveSession"), reset: { includeNoSession: false } });
    }
    for (const tag of filters.mistakeTags) {
      chips.push({
        key: `mistake-${tag}`,
        label: tag,
        reset: { mistakeTags: filters.mistakeTags.filter((value) => value !== tag) },
      });
    }
    for (const outcome of filters.outcomes) {
      chips.push({
        key: `outcome-${outcome}`,
        label: outcome === "win" ? t("outcomeWin") : t("outcomeLoss"),
        reset: { outcomes: filters.outcomes.filter((value) => value !== outcome) },
      });
    }
    if (filters.followedPlan !== "any") {
      chips.push({
        key: "followed-plan",
        label: filters.followedPlan === "yes" ? t("planFollowedYes") : t("planFollowedNo"),
        reset: { followedPlan: "any" },
      });
    }

    return chips;
  }, [filters, t]);

  const hasActiveFilters = activeChips.length > 0 || filters.search.trim() !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("tradesTitle")}</h1>
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                range === r ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {t(rangeLabelKey[r])}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Button type="button" onClick={onAddTrade}>
          {t("addTrade")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchableMultiSelectPopover
          label={t("setupLabel")}
          options={setupOptions}
          selected={filters.setups}
          onChange={(next) => update({ setups: next })}
          searchPlaceholder={t("filterSearchPlaceholder")}
          extraOption={{
            label: t("noSetupTagged"),
            count: counts.noSetupCount,
            checked: filters.includeNoSetup,
            onChange: (checked) => update({ includeNoSetup: checked }),
          }}
        />
        <SearchableMultiSelectPopover
          label={t("tableSession")}
          options={sessionOptions}
          selected={filters.sessions}
          onChange={(next) => update({ sessions: next })}
          searchPlaceholder={t("filterSearchPlaceholder")}
          extraOption={{
            label: t("noActiveSession"),
            count: counts.noSessionCount,
            checked: filters.includeNoSession,
            onChange: (checked) => update({ includeNoSession: checked }),
          }}
        />
        <SearchableMultiSelectPopover
          label={t("symbolLabel")}
          options={symbolOptions}
          selected={filters.symbols}
          onChange={(next) => update({ symbols: next })}
          searchPlaceholder={t("filterSearchPlaceholder")}
        />
        <SearchableMultiSelectPopover
          label={t("mistakeTagsLabel")}
          options={mistakeTagOptions}
          selected={filters.mistakeTags}
          onChange={(next) => update({ mistakeTags: next })}
          searchPlaceholder={t("filterSearchPlaceholder")}
        />
        <ToggleChipGroup
          options={directionValues}
          selected={filters.directions}
          onChange={(next) => update({ directions: next })}
          getLabel={(direction) => (direction === "long" ? t("directionLong") : t("directionShort"))}
        />
        <ToggleChipGroup
          options={outcomeValues}
          selected={filters.outcomes}
          onChange={(next) => update({ outcomes: next })}
          getLabel={(outcome) => (outcome === "win" ? t("outcomeWin") : t("outcomeLoss"))}
        />
        <FollowedPlanToggle value={filters.followedPlan} onChange={(next) => update({ followedPlan: next })} />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onFiltersChange(defaultTradeFilters)}
            className="ml-auto text-xs font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            {t("clearAllFilters")}
          </button>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onFiltersChange({ ...filters, ...chip.reset })}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {chip.label}
              <XIcon className="size-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FollowedPlanToggle({
  value,
  onChange,
}: {
  value: TradeFilters["followedPlan"];
  onChange: (next: TradeFilters["followedPlan"]) => void;
}) {
  const t = useTranslations("dashboard");
  const options: { value: TradeFilters["followedPlan"]; label: string }[] = [
    { value: "any", label: t("followedPlanAny") },
    { value: "yes", label: t("planFollowedYes") },
    { value: "no", label: t("planFollowedNo") },
  ];

  return (
    <div className="flex items-center gap-1 rounded-full border border-border p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            value === option.value ? "bg-primary/15 text-primary" : "text-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

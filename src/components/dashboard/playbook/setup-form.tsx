"use client";

import { useRef, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleChipGroup } from "@/components/ui/toggle-chip-group";
import { DragHandleIcon, XIcon } from "@/components/dashboard/icons";
import { tradeInstruments, type TradeInstrument } from "@/config/trade-instruments";
import { tradingSessions } from "@/config/trade-sessions";
import { sessionTranslationKeys } from "@/components/dashboard/trades/trading-session";
import { cn } from "@/lib/utils";
import type { SetupDTO, SetupInput, SetupStatus } from "@/types/setup";
import type { SessionName } from "@/types/trading-session";

const sessionNames = tradingSessions.map((session) => session.name) as SessionName[];

interface ConditionRow {
  id: string;
  text: string;
}

function formStateFor(setup: SetupDTO | undefined) {
  return {
    name: setup?.name ?? "",
    description: setup?.description ?? "",
    status: (setup?.status ?? "active") as SetupStatus,
    conditions: (setup?.conditions ?? []).map((text) => ({ id: crypto.randomUUID(), text })) as ConditionRow[],
    stopRule: setup?.stopRule ?? "",
    targetRule: setup?.targetRule ?? "",
    minR: setup?.minR === null || setup?.minR === undefined ? "" : String(setup.minR),
    sessions: (setup?.sessions ?? []) as SessionName[],
    instruments: (setup?.instruments ?? []) as TradeInstrument[],
  };
}

function StatusToggle({ value, onChange }: { value: SetupStatus; onChange: (next: SetupStatus) => void }) {
  const t = useTranslations("dashboard");
  const options: { value: SetupStatus; label: string; selectedClass: string }[] = [
    { value: "active", label: t("setupStatusActive"), selectedClass: "bg-success/15 text-success" },
    { value: "testing", label: t("setupStatusTesting"), selectedClass: "bg-warning/15 text-warning" },
    { value: "retired", label: t("setupStatusRetired"), selectedClass: "bg-background text-foreground" },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            value === option.value ? option.selectedClass : "text-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ConditionEditor({
  conditions,
  onChange,
}: {
  conditions: ConditionRow[];
  onChange: (next: ConditionRow[]) => void;
}) {
  const t = useTranslations("dashboard");
  const dragIndex = useRef<number | null>(null);

  function updateText(id: string, text: string) {
    onChange(conditions.map((condition) => (condition.id === id ? { ...condition, text } : condition)));
  }

  function remove(id: string) {
    onChange(conditions.filter((condition) => condition.id !== id));
  }

  function add() {
    onChange([...conditions, { id: crypto.randomUUID(), text: "" }]);
  }

  function handleDrop(targetIndex: number) {
    const fromIndex = dragIndex.current;
    dragIndex.current = null;
    if (fromIndex === null || fromIndex === targetIndex) return;
    const next = [...conditions];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label>{t("entryConditionsLabel")}</Label>
        <p className="text-xs text-muted">{t("entryConditionsHint")}</p>
      </div>

      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <div
            key={condition.id}
            draggable
            onDragStart={() => (dragIndex.current = index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(index)}
            className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-2 py-1.5"
          >
            <DragHandleIcon aria-label={t("dragConditionLabel")} className="size-4 shrink-0 cursor-grab text-muted" />
            <Input
              value={condition.text}
              onChange={(event) => updateText(condition.id, event.target.value)}
              placeholder={t("conditionPlaceholder")}
              className="h-9"
            />
            <button
              type="button"
              aria-label={t("removeCondition")}
              onClick={() => remove(condition.id)}
              className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-background hover:text-danger"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={add} className="text-sm font-medium text-primary transition-colors hover:opacity-80">
        {t("addCondition")}
      </button>
    </div>
  );
}

export function SetupForm({
  setup,
  onClose,
  onSaved,
}: {
  setup?: SetupDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard");
  const [form, setForm] = useState(() => formStateFor(setup));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const payload: SetupInput = {
      name: form.name,
      description: form.description.trim() === "" ? null : form.description,
      status: form.status,
      conditions: form.conditions.map((condition) => condition.text),
      stopRule: form.stopRule.trim() === "" ? null : form.stopRule,
      targetRule: form.targetRule.trim() === "" ? null : form.targetRule,
      minR: form.minR === "" ? null : Number(form.minR),
      sessions: form.sessions,
      instruments: form.instruments,
    };

    const response = setup
      ? await fetch(`/api/setups/${setup.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/setups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setPending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? t("errorGeneric"));
      return;
    }

    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!setup) return;
    if (!window.confirm(t("confirmDeleteSetup"))) return;

    setPending(true);
    const response = await fetch(`/api/setups/${setup.id}`, { method: "DELETE" });
    setPending(false);

    if (!response.ok) {
      setError(t("errorGeneric"));
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <>
      <h2 className="text-lg font-semibold">{setup ? t("editSetup") : t("newSetup")}</h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("setupNameLabel")}</Label>
          <Input id="name" name="name" required value={form.name} onChange={handleChange} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">{t("setupDescriptionLabel")}</Label>
          <Textarea id="description" name="description" value={form.description} onChange={handleChange} />
        </div>

        <div className="space-y-1.5">
          <Label>{t("setupStatusLabel")}</Label>
          <StatusToggle value={form.status} onChange={(status) => setForm((prev) => ({ ...prev, status }))} />
        </div>

        <ConditionEditor
          conditions={form.conditions}
          onChange={(conditions) => setForm((prev) => ({ ...prev, conditions }))}
        />

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="stopRule">{t("stopRuleLabel")}</Label>
            <Input id="stopRule" name="stopRule" value={form.stopRule} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="targetRule">{t("targetRuleLabel")}</Label>
            <Input id="targetRule" name="targetRule" value={form.targetRule} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minR">{t("minRLabel")}</Label>
            <Input id="minR" name="minR" type="number" step="any" min="0" value={form.minR} onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("applicableSessionsLabel")}</Label>
          <ToggleChipGroup
            options={sessionNames}
            selected={form.sessions}
            onChange={(sessions) => setForm((prev) => ({ ...prev, sessions }))}
            getLabel={(session) => t(sessionTranslationKeys[session])}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("applicableInstrumentsLabel")}</Label>
          <ToggleChipGroup
            options={tradeInstruments}
            selected={form.instruments}
            onChange={(instruments) => setForm((prev) => ({ ...prev, instruments }))}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center justify-between gap-3 pt-2">
          {setup ? (
            <Button type="button" variant="outline" disabled={pending} onClick={handleDelete}>
              {t("deleteSetup")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {t("saveSetup")}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

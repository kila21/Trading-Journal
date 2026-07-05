"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PencilIcon } from "@/components/dashboard/icons";
import { tradeTimeframes } from "@/config/trade-timeframes";
import { cn } from "@/lib/utils";
import type { PendingImageEntry } from "@/types/trade";
import type { TradeTimeframe } from "@/config/trade-timeframes";

/**
 * Local-only staging for the create form — a brand-new trade has no id yet,
 * so nothing can actually upload until it's saved. Entries here just sit in
 * memory (with an object-URL thumbnail) until TradeForm uploads them right
 * after the trade itself is created.
 */
export function PendingImageManager({
  entries,
  onAdd,
  onRemove,
  onUpdate,
}: {
  entries: PendingImageEntry[];
  onAdd: (entry: PendingImageEntry) => void;
  onRemove: (localId: string) => void;
  onUpdate: (localId: string, updates: { timeframe: TradeTimeframe; caption: string }) => void;
}) {
  return (
    <div>
      <div className="space-y-3">
        {entries.map((entry) => (
          <PendingImageCard key={entry.localId} entry={entry} onRemove={onRemove} onUpdate={onUpdate} />
        ))}
      </div>

      <AddPendingTimeframe onAdd={onAdd} />
    </div>
  );
}

function PendingImageCard({
  entry,
  onRemove,
  onUpdate,
}: {
  entry: PendingImageEntry;
  onRemove: (localId: string) => void;
  onUpdate: (localId: string, updates: { timeframe: TradeTimeframe; caption: string }) => void;
}) {
  const t = useTranslations("dashboard");
  const [isEditing, setIsEditing] = useState(false);
  const [timeframe, setTimeframe] = useState<TradeTimeframe>(entry.timeframe);
  const [caption, setCaption] = useState(entry.caption);

  function startEditing() {
    setTimeframe(entry.timeframe);
    setCaption(entry.caption);
    setIsEditing(true);
  }

  function cancelEditing() {
    setTimeframe(entry.timeframe);
    setCaption(entry.caption);
    setIsEditing(false);
  }

  function handleSave() {
    onUpdate(entry.localId, { timeframe, caption });
    setIsEditing(false);
  }

  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a static asset */}
        <img
          src={entry.previewUrl}
          alt={entry.timeframe}
          className="h-32 w-32 shrink-0 rounded-lg border border-border object-cover"
        />
        <div className="min-w-0 flex-1 space-y-2">
          {isEditing ? (
            <>
              <Select
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value as TradeTimeframe)}
                className="h-9 w-auto"
              >
                {tradeTimeframes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
              <Textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder={t("captionPlaceholder")}
                className="min-h-16"
              />
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={handleSave}>
                  {t("saveCaption")}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => onRemove(entry.localId)}
                >
                  {t("deleteImage")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="inline-block rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                  {entry.timeframe}
                </span>
                <button
                  type="button"
                  onClick={startEditing}
                  aria-label={t("editTimeframe")}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted transition-colors hover:border-primary hover:text-foreground"
                >
                  <PencilIcon className="size-3" />
                  {t("edit")}
                </button>
              </div>
              <p className={cn("text-sm", entry.caption ? "text-muted" : "italic text-muted/60")}>
                {entry.caption || t("noCaption")}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => onRemove(entry.localId)}>
                {t("deleteImage")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AddPendingTimeframe({ onAdd }: { onAdd: (entry: PendingImageEntry) => void }) {
  const t = useTranslations("dashboard");
  const [isAdding, setIsAdding] = useState(false);
  const [timeframe, setTimeframe] = useState<TradeTimeframe>(tradeTimeframes[0]);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setIsAdding(false);
    setTimeframe(tradeTimeframes[0]);
    setFile(null);
    setCaption("");
    setError(null);
  }

  function handleSubmit() {
    if (!file) {
      setError(t("imageRequired"));
      return;
    }

    onAdd({
      localId: crypto.randomUUID(),
      timeframe,
      file,
      caption,
      previewUrl: URL.createObjectURL(file),
    });
    reset();
  }

  if (!isAdding) {
    return (
      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setIsAdding(true)}>
        {t("addTimeframe")}
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-background/40 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="new-pending-timeframe">{t("timeframeLabel")}</Label>
          <Select
            id="new-pending-timeframe"
            value={timeframe}
            onChange={(event) => setTimeframe(event.target.value as TradeTimeframe)}
          >
            {tradeTimeframes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-pending-image">{t("imageLabel")}</Label>
          <input
            id="new-pending-image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-pending-caption">{t("captionLabel")}</Label>
        <Textarea
          id="new-pending-caption"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder={t("captionPlaceholder")}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          {t("cancel")}
        </Button>
        <Button type="button" size="sm" onClick={handleSubmit}>
          {t("addTimeframeSubmit")}
        </Button>
      </div>
    </div>
  );
}

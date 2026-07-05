"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PencilIcon } from "@/components/dashboard/icons";
import { tradeTimeframes, type TradeTimeframe } from "@/config/trade-timeframes";
import { cn } from "@/lib/utils";
import { useTradeImages, type TradeImageDTO } from "./use-trade-images";

/**
 * Network-backed image management for a trade that already exists (has an
 * id) — fetches, uploads, edits, and deletes immediately. Used by both the
 * Review detail modal and the edit form, since both operate on an already-
 * saved trade. The create form uses PendingImageManager instead, since a
 * brand-new trade has nowhere to upload to yet.
 */
export function TradeImageManager({ tradeId }: { tradeId: string }) {
  const { images, refetch } = useTradeImages(tradeId);

  return (
    <div>
      <div className="space-y-3">
        {images.map((image) => (
          <ImageCard key={image.id} image={image} onChanged={refetch} />
        ))}
      </div>

      <AddTimeframeSection tradeId={tradeId} onAdded={refetch} />
    </div>
  );
}

function ImageCard({ image, onChanged }: { image: TradeImageDTO; onChanged: () => void }) {
  const t = useTranslations("dashboard");
  const [isEditing, setIsEditing] = useState(false);
  const [timeframe, setTimeframe] = useState<TradeTimeframe>(image.timeframe);
  const [caption, setCaption] = useState(image.caption ?? "");
  const [pending, setPending] = useState(false);

  function startEditing() {
    setTimeframe(image.timeframe);
    setCaption(image.caption ?? "");
    setIsEditing(true);
  }

  function cancelEditing() {
    setTimeframe(image.timeframe);
    setCaption(image.caption ?? "");
    setIsEditing(false);
  }

  async function handleSave() {
    setPending(true);
    await fetch(`/api/trade-images/${image.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeframe, caption }),
    });
    setPending(false);
    setIsEditing(false);
    onChanged();
  }

  async function handleDelete() {
    if (!window.confirm(t("confirmDeleteImage"))) return;
    await fetch(`/api/trade-images/${image.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- same-origin uploaded content, not a static asset */}
        <img
          src={image.url}
          alt={image.timeframe}
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
                <Button type="button" size="sm" disabled={pending} onClick={handleSave}>
                  {t("saveCaption")}
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={cancelEditing}>
                  {t("cancel")}
                </Button>
                <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={handleDelete}>
                  {t("deleteImage")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="inline-block rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                  {image.timeframe}
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
              <p className={cn("text-sm", image.caption ? "text-muted" : "italic text-muted/60")}>
                {image.caption || t("noCaption")}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={handleDelete}>
                {t("deleteImage")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AddTimeframeSection({ tradeId, onAdded }: { tradeId: string; onAdded: () => void }) {
  const t = useTranslations("dashboard");
  const [isAdding, setIsAdding] = useState(false);
  const [timeframe, setTimeframe] = useState<TradeTimeframe>(tradeTimeframes[0]);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setIsAdding(false);
    setTimeframe(tradeTimeframes[0]);
    setFile(null);
    setCaption("");
    setError(null);
  }

  async function handleSubmit() {
    if (!file) {
      setError(t("imageRequired"));
      return;
    }

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("timeframe", timeframe);
    formData.append("caption", caption);

    const response = await fetch(`/api/trades/${tradeId}/images`, {
      method: "POST",
      body: formData,
    });

    setPending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? t("errorGeneric"));
      return;
    }

    onAdded();
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
          <Label htmlFor="new-timeframe">{t("timeframeLabel")}</Label>
          <Select
            id="new-timeframe"
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
          <Label htmlFor="new-image">{t("imageLabel")}</Label>
          <input
            id="new-image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-caption">{t("captionLabel")}</Label>
        <Textarea
          id="new-caption"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder={t("captionPlaceholder")}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={reset}>
          {t("cancel")}
        </Button>
        <Button type="button" size="sm" disabled={pending} onClick={handleSubmit}>
          {t("addTimeframeSubmit")}
        </Button>
      </div>
    </div>
  );
}

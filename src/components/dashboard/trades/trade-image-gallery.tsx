"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { XIcon, ChevronRightIcon } from "@/components/dashboard/icons";
import { cn } from "@/lib/utils";
import { useTradeImages } from "./use-trade-images";
import { AddTimeframeSection } from "./trade-image-manager";
import type { TradeImageDTO } from "@/types/trade";

/**
 * Read-only display for the trade review modal: each timeframe gets its own
 * titled section with a large, click-to-expand chart image and the caption
 * below it. Editing/deleting an image is done from the edit form (via
 * TradeImageManager) — the review modal only needs to add new timeframes,
 * since "Edit trade" already covers changing existing ones.
 */
export function TradeImageGallery({ tradeId }: { tradeId: string }) {
  const { images, refetch } = useTradeImages(tradeId);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div>
      <div className="space-y-4">
        {images.map((image, index) => (
          <GallerySection key={image.id} image={image} onExpand={() => setLightboxIndex(index)} />
        ))}
      </div>

      <AddTimeframeSection tradeId={tradeId} onAdded={refetch} />

      {lightboxIndex !== null && images[lightboxIndex] && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

function GallerySection({ image, onExpand }: { image: TradeImageDTO; onExpand: () => void }) {
  const t = useTranslations("dashboard");
  const title = t("timeframeSectionTitle", { timeframe: image.timeframe });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background/40">
      <div className="border-b border-border px-4 py-2.5">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <button type="button" onClick={onExpand} className="block w-full cursor-zoom-in" aria-label={t("viewFullImage")}>
        {/* eslint-disable-next-line @next/next/no-img-element -- same-origin uploaded content, not a static asset */}
        <img src={image.url} alt={title} className="h-64 w-full bg-background object-contain sm:h-80" />
      </button>
      <div className="p-4">
        <p className={cn("text-sm", image.caption ? "text-muted" : "italic text-muted/60")}>
          {image.caption || t("noCaption")}
        </p>
      </div>
    </div>
  );
}

function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: TradeImageDTO[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("dashboard");
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (event.key === "ArrowRight" && index < images.length - 1) onIndexChange(index + 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, images.length, onClose, onIndexChange]);

  const image = images[index];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- same-origin uploaded content, not a static asset */}
      <img
        src={image.url}
        alt={image.caption ?? ""}
        className="max-h-full max-w-full object-contain"
        onClick={(event) => event.stopPropagation()}
      />

      {hasPrev && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onIndexChange(index - 1);
          }}
          aria-label={t("prevImage")}
          className="absolute left-6 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-foreground hover:bg-surface"
        >
          <ChevronRightIcon className="size-5 rotate-180" />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onIndexChange(index + 1);
          }}
          aria-label={t("nextImage")}
          className="absolute right-6 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-foreground hover:bg-surface"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      )}

      {images.length > 1 && (
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-surface/80 px-3 py-1 text-xs font-medium text-foreground">
          {t("imageCounter", { current: index + 1, total: images.length })}
        </span>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label={t("close")}
        className="absolute right-6 top-6 flex size-10 items-center justify-center rounded-full bg-surface/80 text-foreground hover:bg-surface"
      >
        <XIcon className="size-5" />
      </button>
    </div>
  );
}

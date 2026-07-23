"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PlaybookNavIcon } from "@/components/dashboard/icons";

export function PlaybookEmptyState({ onAddSetup }: { onAddSetup: () => void }) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
      <PlaybookNavIcon className="size-8 text-muted" />
      <p className="text-sm font-medium text-foreground">{t("playbookEmptyTitle")}</p>
      <p className="max-w-sm text-sm text-muted">{t("playbookEmptyBody")}</p>
      <Button type="button" onClick={onAddSetup} className="mt-1">
        {t("addSetup")}
      </Button>
    </div>
  );
}

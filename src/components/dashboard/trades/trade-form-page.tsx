"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ChevronLeftIcon } from "@/components/dashboard/icons";
import { TradeForm } from "./trade-form";
import { useTradesRange } from "./use-trades-range";

/** Parses "YYYY-MM-DD" as a local-midnight Date; falls back to today. */
function parseInitialDate(value: string | undefined): Date {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
      <ChevronLeftIcon className="size-4" />
      {label}
    </Link>
  );
}

export function TradeFormPage({ id, initialDate }: { id?: string; initialDate?: string }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const isEdit = id !== undefined;

  const { trades, isLoading } = useTradesRange("all");
  const trade = isEdit ? trades.find((item) => item.id === id) : undefined;
  const backHref = isEdit ? `/dashboard/trades/${id}` : "/dashboard/trades";

  if (isEdit && !trade) {
    return (
      <div className="space-y-4 p-6">
        <BackLink href={backHref} label={t("backToTrades")} />
        {!isLoading && <p className="text-sm text-muted">{t("tradeNotFound")}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <BackLink href={backHref} label={isEdit ? t("backToTrade") : t("backToTrades")} />
      <h1 className="text-2xl font-semibold">{isEdit ? t("editTrade") : t("newTrade")}</h1>
      <TradeForm
        date={parseInitialDate(initialDate)}
        trade={trade}
        onSaved={(saved) => router.push(`/dashboard/trades/${saved.id}`)}
        onCancel={() => router.push(backHref)}
        onDeleted={() => router.push("/dashboard/trades")}
      />
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { TradeFormPage } from "@/components/dashboard/trades/trade-form-page";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("newTrade"), description: t("tradesMetaDescription") };
});

export default async function NewTradePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return <TradeFormPage initialDate={date} />;
}

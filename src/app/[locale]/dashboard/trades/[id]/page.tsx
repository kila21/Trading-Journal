import { getTranslations } from "next-intl/server";
import { TradeDetailView } from "@/components/dashboard/trades/trade-detail-view";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("tradeDetailTitle"), description: t("tradesMetaDescription") };
});

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TradeDetailView id={id} />;
}

import { getTranslations } from "next-intl/server";
import { TradesOverview } from "@/components/dashboard/trades/trades-overview";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("tradesTitle"), description: t("tradesMetaDescription") };
});

export default function TradesPage() {
  return <TradesOverview />;
}

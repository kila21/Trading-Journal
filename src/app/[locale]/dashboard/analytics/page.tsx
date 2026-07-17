import { getTranslations } from "next-intl/server";
import { AnalyticsOverview } from "@/components/dashboard/analytics/analytics-overview";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("analyticsTitle"), description: t("analyticsMetaDescription") };
});

export default function AnalyticsPage() {
  return <AnalyticsOverview />;
}

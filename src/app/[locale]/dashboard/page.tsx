import { getTranslations } from "next-intl/server";
import { DashboardOverview } from "@/components/dashboard/overview/dashboard-overview";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title"), description: t("metaDescription") };
});

export default function DashboardPage() {
  return <DashboardOverview />;
}

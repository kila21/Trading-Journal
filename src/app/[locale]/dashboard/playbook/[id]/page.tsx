import { getTranslations } from "next-intl/server";
import { SetupDetailOverview } from "@/components/dashboard/playbook/setup-detail-overview";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("playbookTitle"), description: t("setupDetailMetaDescription") };
});

export default async function SetupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SetupDetailOverview id={id} />;
}

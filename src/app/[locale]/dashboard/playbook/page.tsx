import { getTranslations } from "next-intl/server";
import { PlaybookOverview } from "@/components/dashboard/playbook/playbook-overview";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("playbookTitle"), description: t("playbookMetaDescription") };
});

export default function PlaybookPage() {
  return <PlaybookOverview />;
}

import { getTranslations } from "next-intl/server";
import { TradeFormPage } from "@/components/dashboard/trades/trade-form-page";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("editTrade"), description: t("tradesMetaDescription") };
});

export default async function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TradeFormPage id={id} />;
}

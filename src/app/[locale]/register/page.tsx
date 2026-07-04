import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "authStub" });
  return { title: t("registerTitle"), description: t("registerDescription") };
});

export default function RegisterPage() {
  const t = useTranslations("authStub");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <Card className="w-full max-w-sm text-center">
        <h1 className="mb-3 text-2xl font-semibold">{t("registerTitle")}</h1>
        <p className="mb-6 text-sm text-muted">{t("registerDescription")}</p>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          {t("backHome")}
        </Link>
      </Card>
    </main>
  );
}

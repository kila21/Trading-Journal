import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "aboutMe" });
  return { title: t("title"), description: t("metaDescription") };
});

export default function AboutMePage() {
  const t = useTranslations("aboutMe");
  const paragraphs = t.raw("paragraphs") as string[];

  return (
    <main className="flex flex-1 justify-center px-6 py-20">
      <Card className="w-full max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold">{t("title")}</h1>
        <div className="space-y-4 text-sm text-muted">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", className: "mt-8" })}
        >
          {t("backHome")}
        </Link>
      </Card>
    </main>
  );
}

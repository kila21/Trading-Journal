import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { createMetadata } from "@/lib/metadata";

interface TermsItem {
  heading: string;
  body: string;
}

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "terms" });
  return { title: t("title"), description: t("metaDescription") };
});

export default function TermsPage() {
  const t = useTranslations("terms");
  const items = t.raw("items") as TermsItem[];

  return (
    <main className="flex flex-1 justify-center px-6 py-20">
      <Card className="w-full max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted">{t("intro")}</p>
        <ol className="mt-6 space-y-4">
          {items.map((item, i) => (
            <li
              key={item.heading}
              className="flex gap-4 rounded-xl border border-border p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-foreground">{item.heading}</p>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
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

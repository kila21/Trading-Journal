import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-28 text-center">
      <h1 className="text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
      <p className="max-w-xl text-lg text-muted">{t("subtitle")}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/register" className={buttonVariants({ size: "lg" })}>
          {t("cta_register")}
        </Link>
        <Link
          href="/login"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          {t("cta_login")}
        </Link>
      </div>
    </section>
  );
}

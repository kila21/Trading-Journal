import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted sm:flex-row sm:justify-between sm:text-left">
        <p>{t("owner")}</p>
        <a href={`mailto:${t("contact")}`} className="hover:text-foreground">
          {t("contact")}
        </a>
        <p>{t("copyright")}</p>
      </div>
    </footer>
  );
}

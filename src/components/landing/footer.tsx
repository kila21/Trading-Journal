import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { footerLinks } from "@/config/site";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Card className="px-4 text-center">
          <nav className="flex flex-wrap items-center justify-center gap-3 text-base text-foreground">
            {footerLinks.map((link, i) => (
              <span key={link.key} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="text-muted">•</span>}
                <a href={link.href} className="hover:text-primary">
                  {t(`links.${link.key}`)}
                </a>
              </span>
            ))}
          </nav>
          <p className="mx-auto mt-4 max-w-5xl text-sm tracking-wide text-muted">
            {t("disclaimer")}
          </p>
        </Card>
        <div className="mt-6 flex flex-col items-center gap-2 text-center text-sm text-muted sm:flex-row sm:justify-between sm:text-left">
          <p>{t("owner")}</p>
          <a href={`mailto:${t("contact")}`} className="hover:text-foreground">
            {t("contact")}
          </a>
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}

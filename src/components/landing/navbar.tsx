import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { navLinks } from "@/config/site";
import { LocaleSwitcher } from "./locale-switcher";

export function Navbar() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-semibold">
          {t("brand")}
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          {navLinks.map((link) => (
            <a key={link.key} href={link.href} className="hover:text-foreground">
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {t("login")}
          </Link>
          <Link
            href="/register"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            {t("register")}
          </Link>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState, type SVGProps } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { navLinks } from "@/config/site";
import { LocaleSwitcher } from "./locale-switcher";

// Small, single-use nav icons — kept local since they're only ever rendered
// inside this section, matching the landing/ convention of colocating
// section-specific icons rather than a shared icons file.
function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function Navbar() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-semibold" onClick={() => setOpen(false)}>
          {t("brand")}
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          {navLinks.map((link) => (
            <a key={link.key} href={link.href} className="hover:text-foreground">
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
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

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? t("closeMenu") : t("openMenu")}
          className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground md:hidden"
        >
          {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4 text-sm text-muted">
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={() => setOpen(false)}
                className="hover:text-foreground"
              >
                {t(link.key)}
              </a>
            ))}
          </nav>

          <div className="mt-4 flex items-center justify-between">
            <LocaleSwitcher />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full" })}
            >
              {t("login")}
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className={buttonVariants({ variant: "primary", size: "sm", className: "w-full" })}
            >
              {t("register")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

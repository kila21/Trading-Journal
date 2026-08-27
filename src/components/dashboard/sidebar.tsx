"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { UserMenu } from "@/components/auth/user-menu";
import { dashboardNavLinks } from "@/config/dashboard-nav";
import { PanelToggleIcon, MenuIcon, XIcon } from "@/components/dashboard/icons";
import { cn } from "@/lib/utils";

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3">
      {dashboardNavLinks.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        const label = t(`nav.${link.key}`);

        return (
          <Link
            key={link.key}
            href={link.href}
            title={collapsed ? label : undefined}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:bg-background hover:text-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const t = useTranslations("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar — only visible below md, replaces the persistent aside */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
        <span className="truncate font-semibold">{t("title")}</span>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t("openSidebar")}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-background hover:text-foreground"
        >
          <MenuIcon className="size-5" />
        </button>
      </div>

      {/* Desktop persistent sidebar */}
      <aside
        className={cn(
          "hidden flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center px-4",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && (
            <span className="truncate font-semibold">{t("title")}</span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            <PanelToggleIcon className="size-5" />
          </button>
        </div>

        <SidebarNav collapsed={collapsed} />

        <div
          className={cn("border-t border-border p-3", collapsed && "flex justify-center")}
        >
          <UserMenu collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile off-canvas drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col border-r border-border bg-surface transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <span className="truncate font-semibold">{t("title")}</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label={t("closeSidebar")}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />

        <div className="border-t border-border p-3">
          <UserMenu collapsed={false} />
        </div>
      </aside>
    </>
  );
}

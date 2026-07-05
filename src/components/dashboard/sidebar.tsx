"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { UserMenu } from "@/components/auth/user-menu";
import { dashboardNavLinks } from "@/config/dashboard-nav";
import { PanelToggleIcon } from "@/components/dashboard/icons";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-surface transition-[width] duration-200",
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

      <div
        className={cn("border-t border-border p-3", collapsed && "flex justify-center")}
      >
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}

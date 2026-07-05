"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { UserIcon, LogoutIcon } from "@/components/dashboard/icons";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.slice(0, 2);
  return initials?.toUpperCase() || "?";
}

export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleLogout() {
    setPending(true);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const user = data?.user;
  const initials = user ? getInitials(user.name) : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("accountMenu")}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground",
          collapsed ? "justify-center p-2" : "px-2 py-2",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {initials ?? <UserIcon className="size-4" />}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1 truncate text-left text-sm text-foreground">
            {user?.name}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute bottom-full z-50 mb-2 w-56 rounded-lg border border-border bg-surface p-1 shadow-lg",
            collapsed ? "left-0" : "left-0 right-0",
          )}
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            disabled={pending}
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
          >
            <LogoutIcon className="size-4" />
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}

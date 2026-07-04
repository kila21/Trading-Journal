"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogoutIcon } from "@/components/dashboard/icons";

export function LogoutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        title={t("logout")}
        aria-label={t("logout")}
        disabled={pending}
        onClick={handleLogout}
        className="flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
      >
        <LogoutIcon className="size-5" />
      </button>
    );
  }

  return (
    <Button variant="outline" disabled={pending} onClick={handleLogout}>
      {t("logout")}
    </Button>
  );
}

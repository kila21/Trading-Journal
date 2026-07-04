"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" disabled={pending} onClick={handleLogout}>
      {t("logout")}
    </Button>
  );
}

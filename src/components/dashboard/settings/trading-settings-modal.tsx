"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTradingSettings } from "./use-trading-settings";

export function TradingSettingsModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("tradingSettings");
  const { settings, refetch } = useTradingSettings();
  const [accountBalance, setAccountBalance] = useState(
    settings?.accountBalance === null || settings?.accountBalance === undefined
      ? ""
      : String(settings.accountBalance),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setAccountBalance(event.target.value);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const response = await fetch("/api/trading-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountBalance: accountBalance.trim() === "" ? null : Number(accountBalance),
      }),
    });

    setPending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? t("errorGeneric"));
      return;
    }

    refetch();
    setSuccess(true);
    setTimeout(onClose, 900);
  }

  return (
    <Dialog onClose={onClose} className="max-w-md">
      <h2 className="mb-1 text-lg font-semibold text-foreground">{t("title")}</h2>
      <p className="mb-6 text-sm text-muted">{t("description")}</p>
      {success ? (
        <p className="text-sm text-foreground">{t("success")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <Label htmlFor="accountBalance">{t("accountBalanceLabel")}</Label>
            <Input
              id="accountBalance"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={accountBalance}
              onChange={handleChange}
            />
            <p className="text-xs text-muted">{t("accountBalanceHint")}</p>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={pending} className="flex-1">
              {t("submit")}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

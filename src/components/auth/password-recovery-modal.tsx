"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/auth-client";
import { authErrorMessage } from "@/components/auth/auth-error-message";

export function PasswordRecoveryModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("passwordRecovery");
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.newPassword !== form.confirmPassword) {
      setError(t("errorPasswordMismatch"));
      return;
    }

    await changePassword(
      {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        revokeOtherSessions: true,
      },
      {
        onRequest: () => setPending(true),
        onResponse: () => setPending(false),
        onError: (ctx) => setError(authErrorMessage(t, ctx.error.code)),
        onSuccess: () => {
          setSuccess(true);
          setTimeout(onClose, 1200);
        },
      },
    );
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
            <Label htmlFor="currentPassword">{t("currentPasswordLabel")}</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={form.currentPassword}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">{t("newPasswordLabel")}</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              value={form.newPassword}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
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

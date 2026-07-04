"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "@/components/auth/auth-error-message";

export function RegisterForm() {
  const t = useTranslations("authStub");
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError(t("errorPasswordMismatch"));
      return;
    }

    await signUp.email(
      { name: form.name, email: form.email, password: form.password },
      {
        onRequest: () => setPending(true),
        onResponse: () => setPending(false),
        onError: (ctx) => setError(authErrorMessage(t, ctx.error.code)),
        onSuccess: () => {
          router.push("/dashboard");
          router.refresh();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={form.name}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
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
      <Button type="submit" disabled={pending} className="w-full">
        {t("registerSubmit")}
      </Button>
      <p className="text-center text-sm text-muted">
        {t("registerFooterPrompt")}{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          {t("registerFooterLink")}
        </Link>
      </p>
    </form>
  );
}

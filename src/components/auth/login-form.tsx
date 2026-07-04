"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "@/components/auth/auth-error-message";

export function LoginForm() {
  const t = useTranslations("authStub");
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    await signIn.email(form, {
      onRequest: () => setPending(true),
      onResponse: () => setPending(false),
      onError: (ctx) => {
        setError(authErrorMessage(t, ctx.error.code));
      },
      onSuccess: () => {
        router.push("/dashboard");
        router.refresh();
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
          autoComplete="current-password"
          required
          value={form.password}
          onChange={handleChange}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {t("loginSubmit")}
      </Button>
      <p className="text-center text-sm text-muted">
        {t("loginFooterPrompt")}{" "}
        <Link href="/register" className="text-foreground underline underline-offset-4">
          {t("loginFooterLink")}
        </Link>
      </p>
    </form>
  );
}

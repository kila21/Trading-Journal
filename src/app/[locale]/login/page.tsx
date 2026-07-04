import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "authStub" });
  return { title: t("loginTitle"), description: t("loginDescription") };
});

export default function LoginPage() {
  const t = useTranslations("authStub");

  return (
    <main className="relative flex flex-1 items-center justify-center px-6 py-20">
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        {t("backHome")}
      </Link>
      <Card className="w-full max-w-md text-center">
        <h1 className="mb-3 text-2xl font-semibold">{t("loginTitle")}</h1>
        <p className="mb-6 text-sm text-muted">{t("loginDescription")}</p>
        <LoginForm />
      </Card>
    </main>
  );
}

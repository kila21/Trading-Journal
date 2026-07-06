import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";
import { createMetadata } from "@/lib/metadata";
import { redirectIfAuthenticated } from "@/lib/require-guest";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "authStub" });
  return { title: t("registerTitle"), description: t("registerDescription") };
});

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await redirectIfAuthenticated(locale);

  const t = await getTranslations("authStub");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <Card className="w-full max-w-md text-center">
        <h1 className="mb-3 text-2xl font-semibold">{t("registerTitle")}</h1>
        <p className="mb-6 text-sm text-muted">{t("registerDescription")}</p>
        <RegisterForm />
      </Card>
    </main>
  );
}

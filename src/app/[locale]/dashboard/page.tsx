import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { createMetadata } from "@/lib/metadata";
import { auth } from "@/lib/auth";

export const generateMetadata = createMetadata(async (locale) => {
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title"), description: t("metaDescription") };
});

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("dashboard");
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return redirect({ href: "/login", locale });
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <Card className="w-full max-w-md text-center">
        <h1 className="mb-3 text-2xl font-semibold">{t("title")}</h1>
        <p className="mb-6 text-sm text-muted">
          {t("loggedInAs", { email: session.user.email })}
        </p>
        <LogoutButton />
      </Card>
    </main>
  );
}

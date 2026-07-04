import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const ogLocales: Record<string, string> = {
  en: "en_US",
  ka: "ka_GE",
};

export function createMetadata(
  loadContent: (
    locale: string,
  ) => Promise<{ title: string; description: string }>,
) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const [{ title, description }, t] = await Promise.all([
      loadContent(locale),
      getTranslations({ locale, namespace: "metadata" }),
    ]);
    const siteName = t("title");
    const ogLocale = ogLocales[locale] ?? "en_US";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        siteName,
        type: "website",
        locale: ogLocale,
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  };
}

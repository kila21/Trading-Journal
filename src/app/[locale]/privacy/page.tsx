import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default function PrivacyPage() {
  const t = useTranslations("privacy");
  const fields = t.raw("fields") as string[];
  const commitments = t.raw("commitments") as string[];

  return (
    <main className="flex flex-1 justify-center px-6 py-20">
      <Card className="w-full max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold">{t("title")}</h1>
        <div className="space-y-4 text-sm text-muted">
          <p>{t("intro")}</p>
          <ul className="list-disc space-y-1 pl-5">
            {fields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
          <p>{t("intro2")}</p>
          <p className="font-medium text-foreground">
            {t("commitmentsHeading")}
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {commitments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{t("rights")}</p>
          <p>{t("acknowledgment")}</p>
        </div>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", className: "mt-8" })}
        >
          {t("backHome")}
        </Link>
      </Card>
    </main>
  );
}

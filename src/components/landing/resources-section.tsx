import { useTranslations } from "next-intl";
import { ResourceCard } from "./resource-card";

interface ResourceItem {
  title: string;
  description: string;
  url: string;
  thumbnail: string;
}

export function ResourcesSection() {
  const t = useTranslations("resources");
  const items = t.raw("items") as ResourceItem[];

  return (
    <section id="resources" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 max-w-xl">
        <h2 className="text-3xl font-semibold">{t("heading")}</h2>
        <p className="mt-2 text-muted">{t("subheading")}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <ResourceCard key={i} {...item} />
        ))}
      </div>
    </section>
  );
}

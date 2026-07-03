import { useTranslations } from "next-intl";
import { Accordion } from "@/components/ui/accordion";

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSection() {
  const t = useTranslations("faq");
  const items = t.raw("items") as FaqItem[];

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="mb-10 text-center text-3xl font-semibold">
        {t("heading")}
      </h2>
      <Accordion
        items={items.map((item, i) => ({
          id: String(i),
          trigger: item.question,
          content: item.answer,
        }))}
      />
    </section>
  );
}

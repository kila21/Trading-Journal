import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ResourcesSection } from "@/components/landing/resources/resources-section";
import { FaqSection } from "@/components/landing/faq/faq-section";
import { AboutCard } from "@/components/landing/about/about-card";
import { Footer } from "@/components/landing/footer";
import { redirectIfAuthenticated } from "@/lib/require-guest";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await redirectIfAuthenticated(locale);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ResourcesSection />
        <FaqSection />
        <AboutCard />
      </main>
      <Footer />
    </>
  );
}

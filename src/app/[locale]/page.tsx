import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ResourcesSection } from "@/components/landing/resources/resources-section";
import { FaqSection } from "@/components/landing/faq/faq-section";
import { AboutCard } from "@/components/landing/about/about-card";
import { Footer } from "@/components/landing/footer";

export default function Home() {
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

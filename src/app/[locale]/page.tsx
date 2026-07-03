import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ResourcesSection } from "@/components/landing/resources-section";
import { FaqSection } from "@/components/landing/faq-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ResourcesSection />
        <FaqSection />
      </main>
      <Footer />
    </>
  );
}

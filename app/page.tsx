import type { Metadata } from "next";
import { ChatPreview } from "@/components/landing/ChatPreview";
import { CtaSection } from "@/components/landing/CtaSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { Hero } from "@/components/landing/Hero";
import { WhySection } from "@/components/landing/WhySection";
import { MarketingShell } from "@/components/layout/MarketingShell";

export const metadata: Metadata = {
  title: { absolute: "Nodir AI — sun'iy intellekt yordamchisi" },
  description:
    "Nodir AI: savol bering, g'oya yarating, kod yozing, tarjima qiling va hujjatlar bilan ishlang. O'zbek tilidagi sun'iy intellekt platformasi.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <MarketingShell>
      <div className="page-enter">
        <Hero />
        <FeatureCards />
        <ChatPreview />
        <WhySection />
        <FaqSection />
        <CtaSection />
      </div>
    </MarketingShell>
  );
}

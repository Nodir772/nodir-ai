import type { Metadata } from "next";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { PricingView } from "@/components/billing/PricingView";

export const metadata: Metadata = {
  title: "Narxlar",
  description: "Nodir AI tariflari. Bepul reja bilan boshlang, kerak bo'lsa kengaytiring.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <PricingView />
    </MarketingShell>
  );
}

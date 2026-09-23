import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boshlash",
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}

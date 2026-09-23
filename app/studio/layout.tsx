import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { PageLoader } from "@/components/ui/loaders";

export const metadata: Metadata = {
  title: "AI Studio",
  description: "Matn, rasm, hujjat, kod, tadqiqot va ovoz — Nodir AI Studio.",
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ChatProvider>{children}</ChatProvider>
    </Suspense>
  );
}

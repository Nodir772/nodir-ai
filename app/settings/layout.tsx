import { Suspense, type ReactNode } from "react";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { PageLoader } from "@/components/ui/loaders";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sozlamalar",
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ChatProvider>{children}</ChatProvider>
    </Suspense>
  );
}

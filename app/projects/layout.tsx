import { Suspense, type ReactNode } from "react";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { PageLoader } from "@/components/ui/loaders";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loyihalar",
};

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ChatProvider>{children}</ChatProvider>
    </Suspense>
  );
}

import { Suspense, type ReactNode } from "react";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { ChatSkeleton } from "@/components/ui/loaders";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
};

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatProvider>{children}</ChatProvider>
    </Suspense>
  );
}

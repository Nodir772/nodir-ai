import { ChatProvider } from "@/components/chat/ChatProvider";
import { Suspense, type ReactNode } from "react";

export default function VoiceLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="grid h-dvh place-items-center text-sm text-muted">Yuklanmoqda...</div>}>
      <ChatProvider>{children}</ChatProvider>
    </Suspense>
  );
}

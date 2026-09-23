import { Suspense, type ReactNode } from "react";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { PageLoader } from "@/components/ui/loaders";

export default function FavoritesLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ChatProvider>{children}</ChatProvider>
    </Suspense>
  );
}

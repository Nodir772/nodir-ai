"use client";

import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import type { SupabasePublicConfig } from "@/lib/supabase/env";
import { ToastProvider } from "@/components/ui/toast-context";
import { ToastViewport } from "@/components/ui/Toast";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

const CommandPalette = dynamic(
  () => import("@/components/command/CommandPalette").then((mod) => mod.CommandPalette),
  { ssr: false },
);

export function Providers({
  children,
  supabase,
}: {
  children: React.ReactNode;
  supabase: SupabasePublicConfig | null;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <LocaleProvider>
      <AuthProvider supabase={supabase}>
        <ToastProvider>
          {children}
          <OfflineBanner />
          <CommandPalette />
          <ToastViewport />
        </ToastProvider>
      </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

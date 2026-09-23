import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export default async function SharedConversationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!isSupabaseConfigured()) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <p className="text-sm text-muted">Ulashilgan suhbat faqat Supabase sozlanganda saqlanadi.</p>
      </main>
    );
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <p className="text-sm text-muted">Ulashilgan suhbat faqat Supabase sozlanganda saqlanadi.</p>
      </main>
    );
  }

  const conversation = await supabase
    .from("shared_conversations")
    .select("title, messages, is_public, created_at")
    .eq("token", token)
    .eq("is_public", true)
    .maybeSingle();

  const row = conversation.data as {
    title?: string;
    messages?: { role: string; content: string }[];
    created_at?: string;
  } | null;

  if (!row) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <p className="text-sm text-muted">Ulashilgan suhbat topilmadi yoki u maxfiy.</p>
      </main>
    );
  }

  const messages = Array.isArray(row.messages) ? row.messages : [];

  return (
    <main className="min-h-dvh py-10">
      <Container className="max-w-3xl">
        <Logo size="sm" />
        <h1 className="mt-6 font-display text-2xl font-semibold">{row.title ?? "Nodir AI suhbat"}</h1>
        <p className="mt-1 text-sm text-muted">
          {row.created_at ? new Date(row.created_at).toLocaleString("uz-UZ") : "Ulashilgan suhbat"}
        </p>
        <div className="mt-6 space-y-4">
          {messages.map((message, index) => (
            <article key={`${index}-${message.role}`} className="rounded-[1.6rem] border border-border bg-card p-5">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted">
                {message.role === "user" ? "Foydalanuvchi" : "Nodir AI"}
              </p>
              <ChatMarkdown content={message.content} />
            </article>
          ))}
        </div>
        <Link
          href="/chat"
          className="mt-8 inline-flex h-11 items-center rounded-full bg-[linear-gradient(135deg,#4f7cff_0%,#8b5cf6_100%)] px-5 text-sm font-medium text-white"
        >
          {SITE_NAME} da o&apos;zingiz ham suhbat boshlang
        </Link>
        <p className="mt-6 text-xs text-muted">
          {SITE_NAME} · {SITE_TAGLINE} Shaxsiy hisob ma&apos;lumotlari bu sahifada ko&apos;rinmaydi.
        </p>
      </Container>
    </main>
  );
}

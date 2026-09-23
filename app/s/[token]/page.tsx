import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export default async function SharedMessagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!isSupabaseConfigured()) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <p className="text-sm text-muted">Ulashilgan javob faqat Supabase sozlanganda saqlanadi.</p>
      </main>
    );
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <p className="text-sm text-muted">Ulashilgan javob faqat Supabase sozlanganda saqlanadi.</p>
      </main>
    );
  }
  const { data } = await supabase
    .from("shared_messages")
    .select("title, content, is_public, created_at")
    .eq("token", token)
    .eq("is_public", true)
    .maybeSingle();

  if (!data) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <p className="text-sm text-muted">Ulashilgan javob topilmadi yoki u maxfiy.</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh py-10">
      <Container className="max-w-3xl">
        <Logo size="sm" />
        <h1 className="mt-6 font-display text-2xl font-semibold">{data.title ?? "Nodir AI javobi"}</h1>
        <p className="mt-1 text-sm text-muted">Ommaviy ulashilgan javob</p>
        <div className="mt-6 rounded-[1.6rem] border border-border bg-card p-5">
          <ChatMarkdown content={data.content} />
        </div>
        <p className="mt-6 text-xs text-muted">
          {SITE_NAME} · {SITE_TAGLINE} Shaxsiy hisob ma&apos;lumotlari bu sahifada ko&apos;rinmaydi.
        </p>
      </Container>
    </main>
  );
}

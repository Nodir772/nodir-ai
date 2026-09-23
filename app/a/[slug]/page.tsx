import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublishedAgent } from "@/lib/agents/store";
import { toPublicAgent } from "@/lib/agents/guard";
import Link from "next/link";

export default async function PublicAgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const agent = await getPublishedAgent(supabase, slug);
  if (!agent || (agent.source === "custom" && !agent.published)) {
    return (
      <main className="mx-auto max-w-lg p-8 text-center">
        <h1 className="font-display text-2xl">Agent topilmadi</h1>
        <Link href="/" className="mt-4 inline-block text-accent">
          Bosh sahifa
        </Link>
      </main>
    );
  }
  const pub = toPublicAgent(agent);
  return (
    <main className="mx-auto max-w-lg p-8">
      <p className="text-xs uppercase tracking-wider text-muted">Ommaviy agent</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">{pub.name}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{pub.description}</p>
      <p className="mt-4 text-sm">Vositalar: {pub.tools.join(", ") || "ko'rsatilmagan"}</p>
      <p className="mt-8 text-xs text-muted">Xotira, fayllar, suhbat va ichki yo&apos;riqnomalar ommaga ochilmaydi.</p>
    </main>
  );
}

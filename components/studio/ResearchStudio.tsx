"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SourcePanel, type SourceItem } from "@/components/studio/SourcePanel";
import { streamStudio } from "@/lib/studio/stream";
import { handleLimitResponse } from "@/components/workspace/LimitModal";

export function ResearchStudio() {
  const [question, setQuestion] = useState("");
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setSearching(true);
    setError(null);
    setSummary("");
    try {
      const search = await fetch(`/api/search?q=${encodeURIComponent(question)}`);
      const json = (await search.json()) as { results?: SourceItem[]; error?: string; code?: string; configured?: boolean };
      handleLimitResponse(json);
      const hits = json.results ?? [];
      setSources(hits);
      setSearching(false);
      if (!hits.length) {
        setError(json.error ?? "Manba topilmadi. Soxta havola yaratilmaydi.");
        return;
      }
      const packed = hits
        .map((hit, index) => `${index + 1}. ${hit.title}\n${hit.url}\n${hit.snippet ?? ""}`)
        .join("\n\n");
      await streamStudio(
        {
          kind: "research",
          input: `Question: ${question}\n\nSources (use only these):\n${packed}\n\nWrite a summary and key findings. Cite source numbers.`,
        },
        setSummary,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tadqiqot bajarilmadi.");
    } finally {
      setBusy(false);
      setSearching(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-6 lg:grid-cols-2">
      <section className="space-y-3 rounded-[1.6rem] border border-border bg-card/80 p-4">
        <label className="block text-sm">
          Tadqiqot savoli
          <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-border bg-background p-3" value={question} onChange={(e) => setQuestion(e.target.value)} />
        </label>
        <Button disabled={busy || !question.trim()} onClick={() => void run()}>
          {searching ? "Qidirilmoqda..." : busy ? "Tahlil..." : "Tadqiqot"}
        </Button>
        <h2 className="pt-2 text-sm font-semibold">Manbalar</h2>
        <SourcePanel sources={sources} />
      </section>
      {summary || error ? (
        <article className="rounded-[1.6rem] border border-border p-4 text-sm">
          <h2 className="font-medium">Xulosa</h2>
          {error ? <p className="mt-2 text-red-400">{error}</p> : null}
          <pre className="mt-3 whitespace-pre-wrap font-sans">{summary}</pre>
        </article>
      ) : (
        <EmptyState title="Tadqiqot savolini yozing" description="Manbalar faqat haqiqiy qidiruv natijalaridan olinadi." />
      )}
    </div>
  );
}

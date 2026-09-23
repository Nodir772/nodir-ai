"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ToolOutput } from "@/components/tools/ToolOutput";
import { EmptyState } from "@/components/ui/EmptyState";
import { streamStudio } from "@/lib/studio/stream";
import { WRITING_ACTIONS, WRITING_LENGTHS, WRITING_TONES } from "@/lib/ai/studio/writing";
import { useToast } from "@/components/ui/toast-context";

export function WritingStudio() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [instruction, setInstruction] = useState("");
  const [tone, setTone] = useState("professional");
  const [action, setAction] = useState("improve");
  const [length, setLength] = useState("medium");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setOutput("");
    try {
      const prompt = `${instruction ? `Instruction: ${instruction}\n` : ""}${input}`;
      await streamStudio({ kind: "writing", input: prompt, tone, action, length }, setOutput);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Yozish bajarilmadi.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const response = await fetch("/api/studio/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "writing", title: input.slice(0, 80), output: { text: output } }),
    });
    if (response.ok) toast("Loyihaga saqlash uchun Studio tarixiga yozildi.", "success");
    else toast("Saqlanmadi.", "error");
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-6 lg:grid-cols-2">
      <section className="space-y-3 rounded-[1.6rem] border border-border bg-card/80 p-4">
        <label className="block text-sm">
          Amal
          <select className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3" value={action} onChange={(e) => setAction(e.target.value)}>
            {WRITING_ACTIONS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Ohang
          <select className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3" value={tone} onChange={(e) => setTone(e.target.value)}>
            {WRITING_TONES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Hajm
          <select className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3" value={length} onChange={(e) => setLength(e.target.value)}>
            {WRITING_LENGTHS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Qo&apos;shimcha ko&apos;rsatma
          <input className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
        </label>
        <label className="block text-sm">
          Matn
          <textarea className="mt-2 min-h-40 w-full rounded-2xl border border-border bg-background p-3 text-sm" value={input} onChange={(e) => setInput(e.target.value)} />
        </label>
        <Button disabled={busy || !input.trim()} onClick={() => void run()}>{busy ? "Yozilmoqda..." : "Yozish"}</Button>
      </section>
      {output || busy || error ? (
        <ToolOutput
          text={output}
          loading={busy}
          error={error}
          onRetry={() => void run()}
          extra={
            <>
              <Button variant="outline" size="sm" disabled={!output} onClick={() => { setInput(output); toast("Matn almashtirildi.", "info"); }}>Almashtirish</Button>
              <Button variant="outline" size="sm" disabled={!output} onClick={() => void save()}>Saqlash</Button>
              <Button variant="outline" size="sm" disabled={busy || !input.trim()} onClick={() => void run()}>Qayta</Button>
            </>
          }
        />
      ) : (
        <EmptyState title="Nodir AI bilan yozishni boshlang" description="Matn kiriting, ohang va amalni tanlang." />
      )}
    </div>
  );
}

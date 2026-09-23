"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { ToolOutput } from "@/components/tools/ToolOutput";
import { streamTool } from "@/lib/tools/stream";

const LENGTHS = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "detailed", label: "Detailed" },
];

export function SummarizerTool({ embed = false }: { embed?: boolean }) {
  const [input, setInput] = useState("");
  const [length, setLength] = useState("medium");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setOutput("");
    try {
      await streamTool({ tool: "summarizer", input, length }, setOutput);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Xizmatda vaqtinchalik muammo yuz berdi.");
    } finally {
      setBusy(false);
    }
  }

  const inner = (
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-[1.6rem] border border-border bg-card/80 p-4">
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLength(item.id)}
                className={`rounded-full px-3 py-2 text-sm ${length === item.id ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="block text-sm">
            Matn
            <textarea className="mt-2 min-h-64 w-full rounded-2xl border border-border bg-background p-3 text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Qisqartiriladigan matnni kiriting..." />
          </label>
          <Button disabled={busy || !input.trim()} onClick={() => void run()}>
            {busy ? "Qisqartirilmoqda..." : "Qisqartirish"}
          </Button>
        </section>
        <ToolOutput text={output} loading={busy} error={error} onRetry={() => void run()} extra={<Button variant="outline" size="sm" disabled={busy || !input.trim()} onClick={() => void run()}>Qayta yaratish</Button>} />
      </div>
  );
  if (embed) return inner;
  return (
    <WorkspaceFrame title="Qisqartirish" subtitle="Uzun matnni aniq xulosaga aylantiring.">
      {inner}
    </WorkspaceFrame>
  );
}

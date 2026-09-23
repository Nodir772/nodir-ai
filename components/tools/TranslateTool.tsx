"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { ToolOutput } from "@/components/tools/ToolOutput";
import { streamTool } from "@/lib/tools/stream";

const LANGUAGES = [
  { id: "auto", label: "Avto aniqlash" },
  { id: "uzbek", label: "O'zbek" },
  { id: "english", label: "English" },
  { id: "russian", label: "Русский" },
  { id: "turkish", label: "Türkçe" },
  { id: "other", label: "Boshqa" },
];

export function TranslateTool({ embed = false }: { embed?: boolean }) {
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("english");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setOutput("");
    try {
      await streamTool(
        { tool: "translate", input, sourceLanguage: source, targetLanguage: target },
        setOutput,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Xizmatda vaqtinchalik muammo yuz berdi.");
    } finally {
      setBusy(false);
    }
  }

  const inner = (
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-[1.6rem] border border-border bg-card/80 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Kirish tili
              <select className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3" value={source} onChange={(e) => setSource(e.target.value)}>
                {LANGUAGES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Chiqish tili
              <select className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3" value={target} onChange={(e) => setTarget(e.target.value)}>
                {LANGUAGES.filter((item) => item.id !== "auto").map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            Tarjima qilinadigan matn
            <textarea
              className="mt-2 min-h-48 w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none"
              placeholder="Tarjima qilinadigan matn..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || !input.trim()} onClick={() => void run()}>
              {busy ? "Tarjima qilinmoqda..." : "Tarjima qilish"}
            </Button>
            <Button variant="ghost" onClick={() => { setInput(""); setOutput(""); setError(null); }}>
              Tozalash
            </Button>
          </div>
        </section>
        <ToolOutput
          text={output}
          loading={busy}
          error={error}
          onRetry={() => void run()}
          extra={
            <Button variant="outline" size="sm" disabled={busy || !input.trim()} onClick={() => void run()}>
              Qayta yaratish
            </Button>
          }
        />
      </div>
  );
  if (embed) return inner;
  return (
    <WorkspaceFrame title="Tarjima" subtitle="Ma'noni saqlagan holda tarjima qiling.">
      {inner}
    </WorkspaceFrame>
  );
}

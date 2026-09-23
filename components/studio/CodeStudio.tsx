"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ToolOutput } from "@/components/tools/ToolOutput";
import { EmptyState } from "@/components/ui/EmptyState";
import { CODE_ACTIONS, CODE_LANGUAGES, lineDiff } from "@/lib/ai/studio/code";
import { streamStudio } from "@/lib/studio/stream";
import { useToast } from "@/components/ui/toast-context";
import { cn } from "@/lib/utils";

export function CodeStudio() {
  const { toast } = useToast();
  const [language, setLanguage] = useState("TypeScript");
  const [action, setAction] = useState("generate");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [accepted, setAccepted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const diff = output && input ? lineDiff(input, output) : [];

  async function run() {
    setBusy(true);
    setError(null);
    setOutput("");
    try {
      await streamStudio({ kind: "code", input, language, action }, setOutput);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Kod yozilmadi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-[1.6rem] border border-border bg-card/80 p-4">
          <label className="block text-sm">
            Til
            <select className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {CODE_LANGUAGES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Amal
            <select className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3" value={action} onChange={(e) => setAction(e.target.value)}>
              {CODE_ACTIONS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Kod / so&apos;rov
            <textarea className="mt-2 min-h-48 w-full rounded-2xl border border-border bg-background p-3 font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} />
          </label>
          <Button disabled={busy || !input.trim()} onClick={() => void run()}>{busy ? "Yozilmoqda..." : "Ishga tushirish"}</Button>
          <p className="text-xs text-muted">Kod serverda bajarilmaydi.</p>
        </div>
        {output || busy || error ? (
          <ToolOutput
            text={accepted ?? output}
            loading={busy}
            error={error}
            onRetry={() => void run()}
            extra={
              <>
                <Button variant="outline" size="sm" disabled={!output} onClick={() => { setAccepted(output); toast("Qabul qilindi.", "success"); }}>Qabul</Button>
                <Button variant="outline" size="sm" disabled={!output} onClick={() => { setOutput(""); setAccepted(null); }}>Rad etish</Button>
              </>
            }
          />
        ) : (
          <EmptyState title="Kodni joylashtiring" description="Tushuntirish, debug yoki yaratish." />
        )}
      </section>
      {diff.length > 0 ? (
        <section className="overflow-x-auto rounded-[1.4rem] border border-border p-3 font-mono text-xs">
          <p className="mb-2 font-sans text-sm">Farq (original / o&apos;zgargan)</p>
          {diff.map((line, index) => (
            <div
              key={`${line.type}-${index}`}
              className={cn(
                "whitespace-pre px-2 py-0.5",
                line.type === "add" && "bg-emerald-500/15",
                line.type === "remove" && "bg-red-500/15",
              )}
            >
              {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "} {line.text}
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}

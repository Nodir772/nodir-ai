"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { ToolOutput } from "@/components/tools/ToolOutput";
import { streamTool } from "@/lib/tools/stream";

const LANGUAGES = ["Dart", "Flutter", "Python", "JavaScript", "TypeScript", "Java", "C++", "HTML/CSS", "SQL", "Other"];

export function CodeTool() {
  const [language, setLanguage] = useState("TypeScript");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action = "generate") {
    setBusy(true);
    setError(null);
    const source = action === "generate" ? input : `${action} this code:\n${output}\n\nOriginal request:\n${input}`;
    setOutput("");
    try {
      await streamTool({ tool: "code", input: source, language, action }, setOutput);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Xizmatda vaqtinchalik muammo yuz berdi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceFrame title="Kod yordamchisi" subtitle="Kod yoziladi, lekin serverda ishga tushirilmaydi.">
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-[1.6rem] border border-border bg-card/80 p-4">
          <label className="block text-sm">Til
            <select className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm">So&apos;rov
            <textarea className="mt-2 min-h-48 w-full rounded-2xl border border-border bg-background p-3 font-mono text-sm" placeholder="Qanday kod kerak?" value={input} onChange={(e) => setInput(e.target.value)} />
          </label>
          <Button disabled={busy || !input.trim()} onClick={() => void run("generate")}>
            {busy ? "Yozilmoqda..." : "Kod yozish"}
          </Button>
        </section>
        <ToolOutput
          text={output}
          loading={busy}
          error={error}
          empty="Kod shu yerda chiqadi."
          onRetry={() => void run("generate")}
          extra={
            <>
              <Button variant="outline" size="sm" disabled={busy || !output} onClick={() => void run("explain")}>Tushuntirish</Button>
              <Button variant="outline" size="sm" disabled={busy || !output} onClick={() => void run("fix")}>Tuzatish</Button>
              <Button variant="outline" size="sm" disabled={busy || !output} onClick={() => void run("improve")}>Yaxshilash</Button>
            </>
          }
        />
      </div>
    </WorkspaceFrame>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { ToolOutput } from "@/components/tools/ToolOutput";
import { streamTool } from "@/lib/tools/stream";

const KINDS = ["Email", "Essay", "Post", "Article", "CV", "Advertisement", "Official letter", "Creative text"];
const TONES = ["Professional", "Friendly", "Simple", "Formal", "Creative"];
const LENGTHS = ["Short", "Medium", "Long"];

export function WriterTool() {
  const [kind, setKind] = useState("Email");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium");
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action = "write") {
    setBusy(true);
    setError(null);
    const source = action === "write" ? topic : output || topic;
    setOutput("");
    try {
      await streamTool({ tool: "writer", input: source, kind, tone, length, action }, setOutput);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Xizmatda vaqtinchalik muammo yuz berdi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceFrame title="Yozish yordamchisi" subtitle="Mavzu, ohang va hajmni tanlang.">
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-[1.6rem] border border-border bg-card/80 p-4">
          <label className="block text-sm">Tur
            <select className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3" value={kind} onChange={(e) => setKind(e.target.value)}>
              {KINDS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm">Ohang
            <select className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3" value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm">Hajm
            <select className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3" value={length} onChange={(e) => setLength(e.target.value)}>
              {LENGTHS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm">Mavzu
            <textarea className="mt-2 min-h-40 w-full rounded-2xl border border-border bg-background p-3 text-sm" placeholder="Nima haqida yozish kerak?" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </label>
          <Button disabled={busy || !topic.trim()} onClick={() => void run("write")}>
            {busy ? "Yozilmoqda..." : "Yozib berish"}
          </Button>
        </section>
        <ToolOutput
          text={output}
          loading={busy}
          error={error}
          onRetry={() => void run("write")}
          extra={
            <>
              <Button variant="outline" size="sm" disabled={busy || !output} onClick={() => void run("improve")}>Yaxshilash</Button>
              <Button variant="outline" size="sm" disabled={busy || !output} onClick={() => void run("shorten")}>Qisqartirish</Button>
              <Button variant="outline" size="sm" disabled={busy || !output} onClick={() => void run("expand")}>Kengaytirish</Button>
              <Button variant="outline" size="sm" disabled={busy || !topic.trim()} onClick={() => void run("write")}>Qayta yaratish</Button>
            </>
          }
        />
      </div>
    </WorkspaceFrame>
  );
}

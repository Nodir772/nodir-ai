"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { ToolOutput } from "@/components/tools/ToolOutput";
import { formatBytes, FILE_ERRORS, FILE_LIMITS } from "@/lib/files/validate";
import { handleLimitResponse } from "@/components/workspace/LimitModal";

const ACTIONS = [
  { id: "summarize", label: "Hujjatni umumlashtirish" },
  { id: "ask", label: "Savol berish" },
  { id: "highlights", label: "Muhim joylarni topish" },
  { id: "outline", label: "Reja tuzish" },
  { id: "translate", label: "Tarjima qilish" },
];

type DocState = {
  id: string;
  filename: string;
  sizeLabel: string;
  mimeType?: string;
  text?: string;
};

export function DocumentsTool({ embed = false }: { embed?: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [doc, setDoc] = useState<DocState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [output, setOutput] = useState("");
  const [asking, setAsking] = useState(false);

  function pick(next: File | null) {
    setError(null);
    setOutput("");
    setDoc(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (next.size > FILE_LIMITS.maxBytes) {
      setError(FILE_ERRORS.tooLarge);
      setFile(null);
      return;
    }
    const ext = next.name.toLowerCase().split(".").pop();
    if (!ext || !["pdf", "txt", "docx"].includes(ext)) {
      setError(FILE_ERRORS.unsupported);
      setFile(null);
      return;
    }
    setFile(next);
  }

  async function analyze() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/documents", { method: "POST", body: form });
      const json = (await response.json()) as { document?: DocState & { text?: string }; error?: string; code?: string };
      handleLimitResponse(json);
      if (!response.ok || !json.document) {
        setError(json.error ?? "Faylni tahlil qilib bo'lmadi.");
        return;
      }
      setDoc({ ...json.document, text: json.document.text });
    } catch {
      setError("Internet aloqasida muammo yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  async function ask(action: string) {
    if (!doc) return;
    setAsking(true);
    setError(null);
    setOutput("");
    try {
      const response = await fetch(`/api/documents/${doc.id}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, question, text: doc.text }),
      });
      const json = (await response.json()) as { text?: string; error?: string; code?: string };
      handleLimitResponse(json);
      if (!response.ok || !json.text) {
        setError(json.error ?? "Hujjat tahlil qilinmadi.");
        return;
      }
      setOutput(json.text);
    } catch {
      setError("Internet aloqasida muammo yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setAsking(false);
    }
  }

  const inner = (
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-[1.6rem] border border-border bg-card/80 p-4">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              pick(event.dataTransfer.files?.[0] ?? null);
            }}
            className={`grid min-h-40 place-items-center rounded-[1.4rem] border border-dashed px-4 text-center text-sm ${
              dragging ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted"
            }`}
          >
            <div className="space-y-3">
              <p>Faylni shu yerga tashlang</p>
              <label className="inline-flex">
                <span className="inline-flex h-11 min-w-[8.5rem] cursor-pointer items-center justify-center rounded-full bg-surface-2 px-4 text-foreground">
                  Fayl tanlash
                </span>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  onChange={(event) => pick(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>
          {file ? (
            <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-3 py-2 text-sm">
              <span className="min-w-0 truncate">
                {file.name} · {file.type || "fayl"} · {formatBytes(file.size)}
              </span>
              <button type="button" className="text-muted hover:text-foreground" onClick={() => pick(null)}>
                Olib tashlash
              </button>
            </div>
          ) : null}
          <Button disabled={!file || busy} onClick={() => void analyze()}>
            {busy ? "Tahlil qilinmoqda..." : "Faylni tahlil qilish"}
          </Button>
          {doc ? <p className="text-xs text-muted">{doc.filename} tahlil qilindi. Endi savol berishingiz mumkin.</p> : null}
          {error && !output ? <p className="text-sm text-amber-200">{error}</p> : null}
        </section>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((item) => (
              <Button key={item.id} variant="outline" size="sm" disabled={!doc || asking} onClick={() => void ask(item.id)}>
                {item.label}
              </Button>
            ))}
          </div>
          <label className="block text-sm">
            Savol
            <input
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3"
              placeholder="Bu hujjatning asosiy g'oyasi nima?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void ask("ask");
                }
              }}
            />
          </label>
          <ToolOutput text={output} loading={asking} error={output ? null : error} empty="Tahlil natijasi shu yerda." />
        </div>
      </div>
  );
  if (embed) return inner;
  return (
    <WorkspaceFrame title="Hujjat tahlili" subtitle="PDF, TXT va DOCX fayllarni tahlil qiling.">
      {inner}
    </WorkspaceFrame>
  );
}

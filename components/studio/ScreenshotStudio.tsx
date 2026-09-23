"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/components/chat/ChatProvider";
import { useToast } from "@/components/ui/toast-context";
import { classifyAttachment } from "@/lib/files/classify";

export function ScreenshotStudio() {
  const { sendMessage } = useChat();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function run() {
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const classified = classifyAttachment(bytes, file.name, file.type);
    if (!classified.ok || classified.class !== "IMAGE") {
      toast(classified.ok ? "Faqat rasm fayllari qabul qilinadi." : classified.error, "error");
      return;
    }
    await sendMessage(question.trim() || "Bu skrinshotda nima bor? Shaxsiy ma'lumotni oshkor qilmang.", [
      {
        id: crypto.randomUUID(),
        name: file.name,
        type: classified.mime ?? file.type,
        size: file.size,
        kind: "IMAGE",
        previewUrl: URL.createObjectURL(file),
        file,
      },
    ]);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <p className="text-sm text-muted">
        Skrinshot yuklang va Nodir AI dan nima tushunishni xohlayotganingizni so&apos;rang. Shaxsiy ma&apos;lumot avtomatik oshkor etilmaydi.
      </p>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="block w-full text-sm"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <textarea
        className="min-h-28 w-full rounded-2xl border border-border bg-background p-3 text-sm"
        placeholder="Masalan: xato xabarini tushuntir"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
      />
      <Button disabled={!file} onClick={() => void run()}>Tahlil qilish</Button>
    </div>
  );
}

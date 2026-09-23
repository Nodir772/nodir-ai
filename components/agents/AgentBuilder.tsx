"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { AGENT_TOOLS } from "@/lib/agents/tools";
import { AGENT_ICONS } from "@/lib/agents/types";
import { AI_MODELS } from "@/lib/ai/models";
import { useToast } from "@/components/ui/toast-context";

export function AgentBuilder({
  initial,
}: {
  initial?: {
    id?: string;
    name: string;
    description: string;
    icon: string;
    instructions: string;
    allowedTools: string[];
    model: string;
  };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "sparkles");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [tools, setTools] = useState<string[]>(initial?.allowedTools ?? ["writing", "summarizer"]);
  const [model, setModel] = useState(initial?.model ?? "nodir-fast");
  const [busy, setBusy] = useState(false);

  function toggleTool(id: string) {
    setTools((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function save() {
    setBusy(true);
    try {
      const response = await fetch(initial?.id ? `/api/agents/${initial.id}` : "/api/agents", {
        method: initial?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, icon, instructions, allowedTools: tools, model }),
      });
      const json = (await response.json()) as { agent?: { id: string }; error?: string };
      if (!response.ok || !json.agent) {
        toast(json.error ?? "Saqlanmadi", "error");
        return;
      }
      toast("Agent saqlandi", "success");
      router.push(`/agents/${json.agent.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceFrame title={initial?.id ? "Agentni tahrirlash" : "Yangi agent"} subtitle="Maxsus yo'riqnoma va vositalar">
      <form
        className="mx-auto flex max-w-xl flex-col gap-4 p-4 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Field label="Nomi">
          <Input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
        </Field>
        <Field label="Tavsif">
          <Input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} />
        </Field>
        <label className="block text-sm font-medium">
          Belgisi
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4"
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
          >
            {AGENT_ICONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Model
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4"
            value={model}
            onChange={(event) => setModel(event.target.value)}
          >
            {AI_MODELS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="text-sm font-medium">Vositalar</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {AGENT_TOOLS.map((tool) => (
              <label key={tool.id} className="flex min-h-11 items-center gap-2 rounded-2xl border border-border px-3 text-sm">
                <input
                  type="checkbox"
                  checked={tools.includes(tool.id)}
                  onChange={() => toggleTool(tool.id)}
                />
                {tool.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-medium">
          Yo&apos;riqnoma
          <textarea
            className="mt-2 min-h-40 w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            maxLength={8000}
            placeholder="Agent qanday yordam bersin? Bu yo'riqnoma platforma xavfsizligidan pastroq turadi."
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Bekor qilish
          </Button>
          <Button disabled={busy}>{busy ? "Saqlanmoqda..." : "Saqlash"}</Button>
        </div>
      </form>
    </WorkspaceFrame>
  );
}

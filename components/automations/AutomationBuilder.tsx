"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/toast-context";

type AgentOption = { id: string; name: string; locked?: boolean };

export function AutomationBuilder() {
  const router = useRouter();
  const { toast } = useToast();
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [agentId, setAgentId] = useState("");
  const [scheduleType, setScheduleType] = useState("once");
  const [scheduleValue, setScheduleValue] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/agents")
      .then((response) => response.json())
      .then((json: { agents?: AgentOption[] }) => {
        const list = (json.agents ?? []).filter((item) => !item.locked);
        setAgents(list);
        if (list[0]) setAgentId(list[0].id);
      })
      .catch(() => undefined);
  }, []);

  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prompt, agentId, scheduleType, scheduleValue, scheduleEnabled }),
      });
      const json = (await response.json()) as { error?: string; notice?: string };
      if (!response.ok) {
        toast(json.error ?? "Saqlanmadi", "error");
        return;
      }
      if (json.notice) toast(json.notice, "success");
      router.push("/automations");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceFrame title="Yangi avtomatlashtirish" subtitle="Jadval serverda tekshiriladi. Cron daemon yo'q.">
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
        <label className="block text-sm font-medium">
          Agent
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4"
            value={agentId}
            onChange={(event) => setAgentId(event.target.value)}
            required
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Vazifa matni
          <textarea
            className="mt-2 min-h-32 w-full rounded-2xl border border-border bg-background p-3 text-sm"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Jadval
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4"
            value={scheduleType}
            onChange={(event) => setScheduleType(event.target.value)}
          >
            <option value="once">Bir marta</option>
            <option value="daily">Har kuni</option>
            <option value="weekly">Har hafta</option>
            <option value="custom">Maxsus</option>
          </select>
        </label>
        {scheduleType === "weekly" || scheduleType === "custom" ? (
          <Field label="Qiymat">
            <Input
              value={scheduleValue}
              onChange={(event) => setScheduleValue(event.target.value)}
              placeholder={scheduleType === "weekly" ? "0–6" : "every_hour yoki weekday_1"}
            />
          </Field>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={scheduleEnabled} onChange={(event) => setScheduleEnabled(event.target.checked)} />
          Jadvalni yoqish (hozircha faqat keyingi vaqtni hisoblaydi)
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

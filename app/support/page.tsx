"use client";

import { useEffect, useState } from "react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/toast-context";

const CATEGORIES = [
  { id: "account", label: "Account" },
  { id: "billing", label: "Billing" },
  { id: "ai", label: "AI" },
  { id: "bug", label: "Bug" },
  { id: "feature", label: "Feature request" },
  { id: "other", label: "Other" },
] as const;

type Ticket = {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
};

export default function SupportPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("other");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  function load() {
    void fetch("/api/support")
      .then((response) => response.json())
      .then((json: { tickets?: Ticket[] }) => setTickets(json.tickets ?? []))
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, category, message }),
    });
    const json = (await response.json()) as { error?: string; ok?: boolean };
    setSending(false);
    if (!response.ok) {
      toast(json.error ?? "Yuborib bo'lmadi.", "error");
      return;
    }
    toast("So'rov yuborildi.", "success");
    setSubject("");
    setMessage("");
    load();
  }

  return (
    <SettingsShell title="Yordam">
      <form onSubmit={(event) => void submit(event)} className="space-y-3">
        <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Mavzu" required />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        >
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          rows={5}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          placeholder="Xabar"
        />
        <Button type="submit" disabled={sending}>
          {sending ? "Yuborilmoqda..." : "Yuborish"}
        </Button>
      </form>
      <ul className="mt-8 space-y-3">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="rounded-2xl border border-border p-4 text-sm">
            <p className="font-medium">{ticket.subject}</p>
            <p className="mt-1 text-muted">
              {ticket.category} · {ticket.status}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{ticket.message}</p>
            {ticket.admin_reply ? <p className="mt-2 text-accent">Javob: {ticket.admin_reply}</p> : null}
          </li>
        ))}
      </ul>
    </SettingsShell>
  );
}

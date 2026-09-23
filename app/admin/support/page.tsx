"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-context";

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  admin_reply: string | null;
};

export default function AdminSupportPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reply, setReply] = useState<Record<string, string>>({});

  function load() {
    void fetch("/api/admin/support")
      .then((response) => response.json())
      .then((json: { tickets?: Ticket[] }) => setTickets(json.tickets ?? []))
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  async function update(id: string, body: Record<string, string>) {
    const response = await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    if (!response.ok) toast("Yangilab bo'lmadi.", "error");
    else {
      toast("Support yangilandi.", "success");
      load();
    }
  }

  return (
    <AdminShell title="Support">
      <ul className="space-y-3">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="rounded-2xl border border-border p-4 text-sm">
            <p className="font-medium">{ticket.subject}</p>
            <p className="text-muted">
              {ticket.category} · {ticket.status}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{ticket.message}</p>
            <textarea
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2"
              value={reply[ticket.id] ?? ticket.admin_reply ?? ""}
              onChange={(event) => setReply((current) => ({ ...current, [ticket.id]: event.target.value }))}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => void update(ticket.id, { reply: reply[ticket.id] ?? "", status: "pending" })}>
                Javob
              </Button>
              <Button variant="ghost" onClick={() => void update(ticket.id, { status: "resolved" })}>
                Yechilgan
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}

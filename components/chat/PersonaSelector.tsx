"use client";

import { PERSONAS } from "@/lib/ai/personas";
import { useChat } from "@/components/chat/ChatProvider";

export function PersonaSelector() {
  const { settings, updateSettings } = useChat();
  return (
    <label className="hidden min-w-0 items-center gap-2 text-xs text-muted md:flex">
      <span className="shrink-0">AI rejimi</span>
      <select
        aria-label="AI rejimi"
        className="h-10 max-w-[9.5rem] rounded-xl border border-border bg-background px-2 text-foreground"
        value={settings.personaId}
        onChange={(event) => void updateSettings({ personaId: event.target.value })}
      >
        {PERSONAS.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.label}
          </option>
        ))}
      </select>
    </label>
  );
}

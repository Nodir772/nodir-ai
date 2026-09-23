"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { SuggestionCard } from "@/components/chat/SuggestionCard";

const SUGGESTIONS = [
  "Menga kod yozib ber",
  "Ingliz tilidan tarjima qil",
  "Biror mavzuni tushuntir",
  "Matn yozishda yordam ber",
];

export function ChatEmptyState({ onSelect }: { onSelect: (text: string) => void }) {
  const [searchNote, setSearchNote] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/search")
      .then((response) => response.json())
      .then((json: { configured?: boolean; error?: string }) => {
        if (json.configured === false) {
          setSearchNote(json.error ?? "Veb-qidiruv xizmati hali sozlanmagan.");
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
      <Logo showWordmark={false} size="lg" />
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Salom, Nodir! 👋
      </h1>
      <p className="mt-3 text-muted">Bugun nimada yordam beray?</p>
      {searchNote ? <p className="mt-2 max-w-md text-xs text-muted">{searchNote}</p> : null}
      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((item) => (
          <SuggestionCard key={item} label={item} onClick={() => onSelect(item)} />
        ))}
      </div>
    </div>
  );
}

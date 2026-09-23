"use client";

export function SuggestionCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-border bg-card px-4 py-4 text-left text-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_16px_40px_-28px_rgba(79,124,255,0.8)]"
    >
      {label}
    </button>
  );
}

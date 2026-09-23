"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { AI_MODES, type AiModeId } from "@/lib/ai/modes";
import { cn } from "@/lib/utils";

export function ModeSelector({
  value,
  onChange,
}: {
  value: AiModeId;
  onChange: (id: AiModeId) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const selected = AI_MODES.find((mode) => mode.id === value) ?? AI_MODES[0];

  useEffect(() => {
    function onClick() {
      setOpen(false);
    }
    if (open) document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-card px-2.5 text-xs font-medium"
      >
        {selected.label}
        <ChevronDown size={12} />
      </button>
      {open ? (
        <ul
          id={menuId}
          role="listbox"
          className="absolute bottom-full left-0 z-30 mb-2 w-56 rounded-2xl border border-border bg-card p-1 shadow-2xl"
        >
          {AI_MODES.map((mode) => (
            <li key={mode.id}>
              <button
                type="button"
                role="option"
                aria-selected={mode.id === value}
                onClick={() => {
                  onChange(mode.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left hover:bg-surface-2",
                  mode.id === value && "bg-surface-2",
                )}
              >
                <span className="mt-0.5 w-4 text-accent">
                  {mode.id === value ? <Check size={14} /> : null}
                </span>
                <span>
                  <span className="block text-sm font-medium">{mode.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{mode.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

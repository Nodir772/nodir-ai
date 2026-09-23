"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FEATURE_SHORTCUTS, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { storePendingPrompt } from "@/lib/pending-prompt";
import { cn } from "@/lib/utils";

export function Hero() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submitPrompt(text?: string) {
    const next = (text ?? value).trim();
    if (!next) {
      setError("Iltimos, savolingizni yozing.");
      return;
    }
    setError("");
    storePendingPrompt(next);
    router.push("/chat");
  }

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-8rem] h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(79,124,255,0.28),transparent_64%)] blur-2xl" />
        <div className="absolute right-[-6rem] top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.22),transparent_70%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur">
          <Sparkles size={14} className="text-accent" />
          Shaxsiy sun&apos;iy intellekt platformasi
        </p>
        <h1 className="font-display text-5xl font-semibold tracking-tight text-foreground sm:text-7xl">
          {SITE_NAME}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          {SITE_TAGLINE}
        </p>

        <form
          className="mx-auto mt-10 max-w-3xl"
          onSubmit={(event) => {
            event.preventDefault();
            submitPrompt();
          }}
        >
          <label htmlFor="hero-prompt" className="sr-only">
            Savolingizni yozing
          </label>
          <div className="glass flex items-end gap-2 rounded-[1.75rem] p-2 shadow-[0_20px_80px_-40px_rgba(79,124,255,0.8)]">
            <textarea
              id="hero-prompt"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submitPrompt();
                }
              }}
              rows={2}
              placeholder="Savolingizni yozing..."
              className="min-h-[3.25rem] flex-1 resize-none bg-transparent px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="mb-1 mr-1 inline-flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#4f7cff_0%,#8b5cf6_100%)] px-5 text-sm font-medium text-white transition hover:brightness-110"
            >
              Yuborish
              <ArrowUpRight size={16} />
            </button>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted">
              Enter — yuborish, Shift + Enter — yangi qator
            </p>
          )}
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {FEATURE_SHORTCUTS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                storePendingPrompt(`${item.label}: `);
                router.push(item.href);
              }}
              className={cn(
                "rounded-full border border-border bg-surface/80 px-4 py-2 text-sm text-muted transition",
                "hover:border-accent/40 hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

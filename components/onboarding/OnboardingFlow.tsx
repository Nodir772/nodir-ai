"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiUpdateSettings } from "@/lib/chat/api";
import type { ChatSettings } from "@/types/chat";

const CASES = [
  { id: "chat", label: "Suhbat va savollar" },
  { id: "code", label: "Kod yozish" },
  { id: "write", label: "Matn yozish" },
  { id: "docs", label: "Hujjatlar" },
  { id: "other", label: "Boshqa" },
] as const;

const STYLES = [
  { id: "qisqa", label: "Qisqa" },
  { id: "muvozanatli", label: "Muvozanatli" },
  { id: "batafsil", label: "Batafsil" },
] as const;

const STORAGE_KEY = "nodir-ai:onboarding";

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [useCase, setUseCase] = useState("chat");
  const [style, setStyle] = useState<ChatSettings["responseStyle"]>("muvozanatli");
  const [saving, setSaving] = useState(false);

  async function finish(skip = false) {
    setSaving(true);
    localStorage.setItem(STORAGE_KEY, "done");
    if (!skip) {
      await apiUpdateSettings({
        responseStyle: style,
        useCase,
        onboardingCompleted: true,
      }).catch(() => undefined);
    } else {
      await apiUpdateSettings({ onboardingCompleted: true }).catch(() => undefined);
    }
    setSaving(false);
    router.push("/chat");
    router.refresh();
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-lg rounded-[1.6rem] border border-border bg-card p-6 sm:p-8">
        {step === 0 ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Xush kelibsiz</p>
            <h1 className="mt-3 font-display text-3xl font-semibold">Nodir AI ga xush kelibsiz</h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Suhbat, kod, yozish va hujjatlar — barchasi bitta joyda. Sozlamalarni keyin ham o&apos;zgartirasiz.
            </p>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <h1 className="font-display text-2xl font-semibold">Nima uchun ishlatasiz?</h1>
            <div className="mt-4 grid gap-2">
              {CASES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setUseCase(item.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                    useCase === item.id ? "border-accent/50 bg-surface-2" : "border-border hover:bg-surface-2/70"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <h1 className="font-display text-2xl font-semibold">Javob uslubi</h1>
            <div className="mt-4 grid gap-2">
              {STYLES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStyle(item.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                    style === item.id ? "border-accent/50 bg-surface-2" : "border-border hover:bg-surface-2/70"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" disabled={saving} onClick={() => void finish(true)}>
            O&apos;tkazib yuborish
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep((value) => value + 1)}>Davom etish</Button>
          ) : (
            <Button disabled={saving} onClick={() => void finish(false)}>
              {saving ? "Saqlanmoqda..." : "Boshlash"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

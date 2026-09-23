"use client";

import { Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { handleLimitResponse } from "@/components/workspace/LimitModal";
import { useToast } from "@/components/ui/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

const RATIOS = ["1:1", "16:9", "9:16"] as const;
const STYLES = ["Realistic", "Illustration", "3D", "Anime", "Minimal", "Cinematic"] as const;
const QUALITIES = ["Standard", "High"] as const;

type ImageItem = {
  id: string;
  prompt: string;
  url: string | null;
  createdAt: string;
  favorite?: boolean;
  style?: string;
};

export function ImageTool({ embed = false }: { embed?: boolean }) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>("1:1");
  const [style, setStyle] = useState<(typeof STYLES)[number]>("Realistic");
  const [quality, setQuality] = useState<(typeof QUALITIES)[number]>("Standard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    void fetch("/api/images?limit=12")
      .then((response) => response.json())
      .then((json: { images?: ImageItem[] }) => {
        if (json.images) setImages(json.images);
      })
      .catch(() => undefined);
  }, []);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio: ratio, style, quality }),
      });
      const json = (await response.json()) as { image?: ImageItem; error?: string; code?: string };
      handleLimitResponse(json);
      if (!response.ok || !json.image?.url) {
        setError(json.error ?? "Rasm yaratish xizmati hali sozlanmagan.");
        return;
      }
      setImages((items) => [json.image!, ...items]);
    } catch {
      setError("Internet aloqasida muammo yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  const inner = (
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <section className="space-y-4 rounded-[1.6rem] border border-border bg-card/80 p-4 sm:p-6">
          <label className="block text-sm">
            Qanday rasm yaratmoqchisiz?
            <textarea
              className="mt-2 min-h-32 w-full rounded-2xl border border-border bg-background p-3 text-sm"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Qanday rasm yaratmoqchisiz?"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Nisbat" value={ratio} onChange={setRatio} options={RATIOS} />
            <Field label="Uslub" value={style} onChange={setStyle} options={STYLES} />
            <Field label="Sifat" value={quality} onChange={setQuality} options={QUALITIES} />
          </div>
          <Button disabled={busy || !prompt.trim()} onClick={() => void generate()}>
            {busy ? "Yaratilmoqda..." : "Rasm yaratish"}
          </Button>
          {error ? <ErrorState error={error} onRetry={() => void generate()} className="py-6" /> : null}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Galereya</h2>
          {images.length === 0 ? (
            <EmptyState title="Birinchi rasmingizni yarating" description="Tavsif yozib yarating." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-[1.4rem] border border-border bg-card">
                  {item.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.prompt} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="grid h-48 place-items-center text-sm text-muted">Ko&apos;rish uchun ruxsat yo&apos;q</div>
                  )}
                  <div className="space-y-2 p-3">
                    <p className="line-clamp-2 text-sm">{item.prompt}</p>
                    <p className="text-xs text-muted">{new Date(item.createdAt).toLocaleString("uz-UZ")}</p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2"
                        aria-label="Sevimli"
                        onClick={() => {
                          void fetch(`/api/images/${item.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ favorite: !item.favorite }),
                          }).then(() => {
                            setImages((rows) => rows.map((row) => (row.id === item.id ? { ...row, favorite: !row.favorite } : row)));
                          });
                        }}
                      >
                        <Star size={16} className={item.favorite ? "fill-accent text-accent" : undefined} />
                      </button>
                      <button
                        type="button"
                        className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2"
                        aria-label="O'chirish"
                        onClick={() => {
                          void fetch(`/api/images/${item.id}`, { method: "DELETE" }).then(() => {
                            setImages((rows) => rows.filter((row) => row.id !== item.id));
                            toast("Suhbat o'chirildi", "success");
                          });
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
  );
  if (embed) return inner;
  return (
    <WorkspaceFrame title="Rasm yaratish" subtitle="Fikringizni rasmga aylantiring.">
      {inner}
    </WorkspaceFrame>
  );
}

function Field<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
}) {
  return (
    <label className="text-sm">
      {label}
      <select
        className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

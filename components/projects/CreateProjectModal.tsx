"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/toast-context";
import { PROJECT_ICONS, type ProjectIcon } from "@/lib/projects/types";

const ICON_LABELS: Record<ProjectIcon, string> = {
  folder: "Jild",
  book: "Kitob",
  code: "Kod",
  pen: "Qalam",
  search: "Qidiruv",
  spark: "Uchqun",
};

export function CreateProjectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<ProjectIcon>("folder");
  const [saving, setSaving] = useState(false);

  async function create() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast("Loyiha nomini yozing", "error");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, description, icon }),
      });
      const json = (await response.json()) as { project?: { id: string }; error?: string };
      if (!response.ok || !json.project) throw new Error(json.error);
      setName("");
      setDescription("");
      setIcon("folder");
      onClose();
      router.push(`/projects/${json.project.id}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Loyiha yaratilmadi.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Yangi loyiha" onClose={onClose} className="max-w-md">
      <div className="space-y-4">
        <Field label="Nomi">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Masalan, Flutter kurs" />
        </Field>
        <Field label="Tavsif">
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Qisqa izoh (ixtiyoriy)"
          />
        </Field>
        <div>
          <p className="text-sm font-medium">Belgi</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROJECT_ICONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setIcon(item)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  icon === item ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"
                }`}
              >
                {ICON_LABELS[item]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={() => void create()} disabled={saving}>
            {saving ? "Yaratilmoqda..." : "Yaratish"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

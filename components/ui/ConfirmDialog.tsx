"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Tasdiqlash",
  cancelLabel = "Bekor qilish",
  tone = "danger",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} className="max-w-md">
      <p className="text-sm leading-6 text-muted">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === "danger" ? "primary" : "primary"}
          className={tone === "danger" ? "bg-red-600 shadow-none hover:brightness-110" : undefined}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

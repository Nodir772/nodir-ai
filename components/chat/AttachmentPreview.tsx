"use client";

import { X } from "lucide-react";
import type { AttachmentFile } from "@/types/chat";
import { formatBytes } from "@/lib/files/validate";

const KIND_LABEL: Record<AttachmentFile["kind"], string> = {
  IMAGE: "Rasm",
  DOCUMENT: "Hujjat",
  UNSUPPORTED: "Noma'lum",
};

export function AttachmentPreview({
  files,
  onRemove,
  processing = false,
}: {
  files: AttachmentFile[];
  onRemove: (id: string) => void;
  processing?: boolean;
}) {
  if (files.length === 0) return null;

  return (
    <ul className="mb-2 flex flex-wrap gap-2" aria-live="polite">
      {files.map((file) => (
        <li
          key={file.id}
          className="flex max-w-full items-center gap-2 rounded-2xl border border-border bg-card px-2 py-1.5 text-xs"
        >
          {file.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.previewUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-surface-2 text-[10px] uppercase text-muted">
              {KIND_LABEL[file.kind]}
            </span>
          )}
          <span className="min-w-0">
            <span className="block max-w-[10rem] truncate font-medium">{file.name}</span>
            <span className="text-[10px] text-muted">
              {KIND_LABEL[file.kind]} · {formatBytes(file.size)}
              {processing ? " · yuklanmoqda" : ""}
              {file.error ? ` · ${file.error}` : ""}
            </span>
          </span>
          <button
            type="button"
            aria-label={`${file.name} ni olib tashlash`}
            onClick={() => onRemove(file.id)}
            className="ml-1 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <X size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}

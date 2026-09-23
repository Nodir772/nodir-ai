"use client";

import { AttachmentPreview } from "@/components/chat/AttachmentPreview";
import type { AttachmentFile } from "@/types/chat";

export function AttachmentManager({
  files,
  onRemove,
  progress,
}: {
  files: AttachmentFile[];
  onRemove: (id: string) => void;
  progress?: number | null;
}) {
  return (
    <div>
      <AttachmentPreview files={files} onRemove={onRemove} />
      {typeof progress === "number" ? (
        <p className="mb-2 text-xs text-muted" role="status">
          Yuklanmoqda... {progress}%
        </p>
      ) : null}
    </div>
  );
}

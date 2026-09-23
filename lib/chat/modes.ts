import {
  Code2,
  FileText,
  Globe,
  ImageIcon,
  MessageSquare,
  PenLine,
} from "lucide-react";
import type { ChatMode } from "@/types/chat";

export const CHAT_MODES: {
  id: ChatMode;
  label: string;
  icon: typeof MessageSquare;
  placeholder: string;
}[] = [
  { id: "chat", label: "Chat", icon: MessageSquare, placeholder: "Xabar yozing..." },
  {
    id: "translate",
    label: "Tarjima",
    icon: Globe,
    placeholder: "Tarjima qilinadigan matnni yozing...",
  },
  {
    id: "write",
    label: "Matn yozish",
    icon: PenLine,
    placeholder: "Yoziladigan mavzu yoki matnni kiriting...",
  },
  {
    id: "code",
    label: "Kod yozish",
    icon: Code2,
    placeholder: "Qanday kod kerakligini yozing...",
  },
  {
    id: "image",
    label: "Rasm yaratish",
    icon: ImageIcon,
    placeholder: "Rasm tavsifini yozing...",
  },
  {
    id: "docs",
    label: "Hujjat tahlili",
    icon: FileText,
    placeholder: "Hujjat haqidagi savolingizni yozing...",
  },
];

export function getMode(id: ChatMode) {
  return CHAT_MODES.find((mode) => mode.id === id) ?? CHAT_MODES[0];
}

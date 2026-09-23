"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastItem = {
  id: string;
  message: string;
  tone?: "success" | "error" | "info";
};

type ToastContextValue = {
  toasts: ToastItem[];
  toast: (message: string, tone?: ToastItem["tone"]) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastItem["tone"] = "info") => {
      const id = crypto.randomUUID();
      setToasts((items) => [...items, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

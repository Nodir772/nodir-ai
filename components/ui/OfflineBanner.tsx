"use client";

import { useEffect, useRef, useState } from "react";

export function OfflineBanner() {
  const [status, setStatus] = useState<"offline" | "back" | null>(null);
  const wasOffline = useRef(false);

  useEffect(() => {
    function onOffline() {
      wasOffline.current = true;
      setStatus("offline");
    }
    function onOnline() {
      if (!wasOffline.current) return;
      setStatus("back");
      window.setTimeout(() => setStatus(null), 2800);
    }
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    const timer = window.setTimeout(() => {
      if (!navigator.onLine) onOffline();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!status) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center px-3 pt-3"
    >
      <p
        className={
          status === "back"
            ? "rounded-full border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100"
            : "rounded-full border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-sm text-amber-100"
        }
      >
        {status === "back" ? "Aloqa tiklandi" : "Siz oflaynsiz"}
      </p>
    </div>
  );
}

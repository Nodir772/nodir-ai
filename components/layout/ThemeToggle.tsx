"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";
import { useMounted } from "@/hooks/useMounted";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={mounted ? (isDark ? "Yorug' rejim" : "Qorong'u rejim") : "Mavzuni almashtirish"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-2xl"
    >
      {mounted ? (
        isDark ? (
          <Sun size={18} />
        ) : (
          <Moon size={18} />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </Button>
  );
}

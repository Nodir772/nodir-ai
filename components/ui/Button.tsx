import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
};

const variants = {
  primary:
    "bg-[linear-gradient(135deg,#4f7cff_0%,#6d5efc_50%,#8b5cf6_100%)] text-white shadow-[0_10px_30px_-12px_rgba(99,102,241,0.9)] hover:brightness-110",
  secondary:
    "bg-surface-2 text-foreground ring-1 ring-border hover:bg-surface-3",
  ghost: "text-muted hover:bg-surface-2 hover:text-foreground",
  outline:
    "bg-transparent text-foreground ring-1 ring-border hover:bg-surface-2",
};

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
  icon: "h-11 w-11",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-8 w-8 text-[13px]",
  md: "h-10 w-10 text-[15px]",
  lg: "h-14 w-14 text-xl",
};

export function Logo({
  className,
  markClassName,
  showWordmark = true,
  size = "md",
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative grid place-items-center rounded-2xl font-display font-semibold text-white shadow-[0_0_24px_-6px_rgba(99,102,241,0.85)]",
          "bg-[linear-gradient(135deg,#4f7cff_0%,#6d5efc_52%,#8b5cf6_100%)]",
          sizes[size],
          markClassName,
        )}
        aria-hidden="true"
      >
        <span className="pointer-events-none absolute inset-px rounded-[14px] bg-white/10" />
        N
      </span>
      {showWordmark ? (
        <span className="font-display text-[1.05rem] font-semibold tracking-tight text-foreground">
          Nodir <span className="text-gradient">AI</span>
        </span>
      ) : (
        <span className="sr-only">Nodir AI</span>
      )}
    </span>
  );
}

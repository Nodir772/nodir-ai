import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-6rem] left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(79,124,255,0.28),transparent_64%)] blur-2xl" />
      </div>
      <div className="relative w-full max-w-md page-enter">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="rounded-xl">
            <Logo />
          </Link>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>
        <div className="rounded-[1.75rem] border border-border bg-card/80 p-6 shadow-[0_30px_80px_-40px_rgba(79,124,255,0.7)] backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}

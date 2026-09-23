import { cn } from "@/lib/utils";

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-surface-2", className)} />;
}

export function PageLoader({ label = "Yuklanmoqda..." }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4" role="status" aria-live="polite">
      <div className="w-full max-w-md space-y-4 text-center">
        <Pulse className="mx-auto h-12 w-12 rounded-2xl" />
        <Pulse className="mx-auto h-6 w-48" />
        <Pulse className="mx-auto h-4 w-64" />
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex h-dvh overflow-hidden bg-background" aria-busy="true" aria-label="Chat yuklanmoqda">
      <SidebarSkeleton className="hidden lg:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Pulse className="m-4 h-12 rounded-2xl" />
        <MessageSkeleton />
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6" aria-hidden>
      <Pulse className="h-16 w-4/5 rounded-2xl" />
      <Pulse className="ml-auto h-12 w-2/3 rounded-2xl" />
      <Pulse className="h-24 w-5/6 rounded-2xl" />
      <Pulse className="ml-auto h-10 w-1/2 rounded-2xl" />
    </div>
  );
}

export function SidebarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-[270px] shrink-0 flex-col gap-3 border-r border-border bg-secondary p-4", className)}>
      <Pulse className="h-8 w-32" />
      <Pulse className="h-11 w-full rounded-2xl" />
      <Pulse className="h-10 w-full" />
      <Pulse className="h-10 w-full" />
      <Pulse className="h-10 w-full" />
      <Pulse className="mt-4 h-8 w-full" />
      <Pulse className="h-8 w-full" />
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-border bg-card p-5", className)} aria-hidden>
      <Pulse className="h-5 w-40" />
      <Pulse className="mt-3 h-16 w-full" />
      <Pulse className="mt-3 h-9 w-28 rounded-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border" aria-hidden>
      <Pulse className="h-11 rounded-none" />
      {Array.from({ length: rows }).map((_, index) => (
        <Pulse key={index} className="mt-px h-12 rounded-none" />
      ))}
    </div>
  );
}

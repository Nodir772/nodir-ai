"use client";

export type SourceItem = {
  title: string;
  url: string;
  snippet?: string;
  domain?: string;
  type?: string;
};

export function SourcePanel({ sources }: { sources: SourceItem[] }) {
  if (!sources.length) {
    return <p className="text-sm text-muted">Hali manba yo&apos;q. Qidiruv sozlangan bo&apos;lsa, natijalar shu yerda chiqadi.</p>;
  }
  return (
    <ul className="space-y-2">
      {sources.map((source) => {
        const domain = source.domain || (() => {
          try {
            return new URL(source.url).hostname;
          } catch {
            return "";
          }
        })();
        return (
          <li key={source.url} className="rounded-2xl border border-border p-3 text-sm">
            <p className="font-medium">{source.title}</p>
            <p className="text-xs text-muted">{domain} · tashqi manba</p>
            {source.snippet ? <p className="mt-1 text-muted">{source.snippet}</p> : null}
            <a href={source.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-accent">
              Ochish
            </a>
          </li>
        );
      })}
    </ul>
  );
}

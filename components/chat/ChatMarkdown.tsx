"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import "highlight.js/styles/github-dark.css";

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "text";
  const text = String(children).replace(/\n$/, "");

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function download() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kod.${language === "text" ? "txt" : language}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="group/code my-3 overflow-hidden rounded-2xl border border-border bg-[#0a1020]">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 text-[11px] text-muted">
        <span className="uppercase tracking-wider">{language}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/5 hover:text-foreground"
            aria-label="Kodni yuklab olish"
          >
            <Download size={12} />
            Yuklash
          </button>
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/5 hover:text-foreground"
            aria-label="Kodni nusxalash"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Nusxa olindi" : "Nusxa"}
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6">
        <code className={cn("hljs", className)}>{children}</code>
      </pre>
    </div>
  );
}

export function ChatMarkdown({ content, streaming = false }: { content: string; streaming?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelectorAll("a").forEach((anchor) => {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noreferrer");
    });
  }, [content]);

  if (!content) {
    return <span className="inline-block h-4 w-1 animate-pulse rounded-sm bg-accent/80" aria-hidden="true" />;
  }

  return (
    <MarkdownBoundary fallback={content}>
      <div ref={ref} className="markdown-body text-[15px] leading-7">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={streaming ? [] : [rehypeHighlight]}
          components={{
          h1: ({ children }) => <h1 className="mb-3 mt-5 text-2xl font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-4 text-xl font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold">{children}</h3>,
          p: ({ children }) => <p className="my-2">{children}</p>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-accent/50 pl-4 text-muted">{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-accent underline-offset-2 hover:underline">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full min-w-[24rem] border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-surface-2 px-3 py-2 font-medium">{children}</th>
          ),
          td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
          code: ({ className, children, ...props }) => {
            const isBlock = Boolean(className);
            if (isBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[13px]" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
      </div>
    </MarkdownBoundary>
  );
}

class MarkdownBoundary extends React.Component<
  { children: React.ReactNode; fallback: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <p className="whitespace-pre-wrap">{this.props.fallback}</p>;
    }
    return this.props.children;
  }
}

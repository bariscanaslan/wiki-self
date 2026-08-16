"use client";

import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const CodeContent = NodeViewContent<"code">;

export function CodeBlockComponent({ node }: ReactNodeViewProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      toast.success("Kod kopyalandı");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Kod kopyalanamadı");
    }
  }

  return (
    <NodeViewWrapper className="group relative">
      <button
        type="button"
        onClick={handleCopy}
        contentEditable={false}
        title="Kodu kopyala"
        aria-label="Kodu kopyala"
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 group-hover:opacity-100"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre>
        <CodeContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

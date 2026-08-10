"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils/cn";
import type { DocumentSummary } from "../../lib/types";

export function DocumentLeaf({ document, depth }: { document: DocumentSummary; depth: number }) {
  const pathname = usePathname();
  const isActive = pathname === `/documents/${document.id}`;

  return (
    <Link
      href={`/documents/${document.id}`}
      style={{ paddingLeft: `${depth * 16 + 28}px` }}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-zinc-100",
        isActive ? "bg-primary-50 font-medium text-primary-700" : "text-zinc-600",
      )}
    >
      <FileText size={14} className="shrink-0 text-zinc-400" />
      <span className="truncate">{document.title}</span>
    </Link>
  );
}

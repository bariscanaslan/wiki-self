"use client";

import { Folder } from "lucide-react";
import { canEdit, canManage } from "../../../lib/auth/permissions";
import { cn } from "../../../lib/utils/cn";
import type { FolderTreeNode } from "../../../lib/types";

interface FolderPickerTreeProps {
  nodes: FolderTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
  excludeSubtreeOf?: string;
  requireManage?: boolean;
}

export function FolderPickerTree({ nodes, selectedId, onSelect, depth = 0, excludeSubtreeOf, requireManage }: FolderPickerTreeProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {nodes.map((node) => {
        if (excludeSubtreeOf && node.id === excludeSubtreeOf) {
          return null;
        }

        const allowed = requireManage ? canManage(node.effectivePermission) : canEdit(node.effectivePermission);

        return (
          <div key={node.id}>
            <button
              type="button"
              disabled={!allowed}
              onClick={() => onSelect(node.id)}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                selectedId === node.id ? "bg-primary-50 dark:bg-primary-500/10 font-medium text-primary-700 dark:text-primary-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
              )}
            >
              <Folder size={14} className="shrink-0 text-zinc-400 dark:text-zinc-500" />
              <span className="truncate">{node.name}</span>
            </button>
            {node.children.length > 0 && (
              <FolderPickerTree
                nodes={node.children}
                selectedId={selectedId}
                onSelect={onSelect}
                depth={depth + 1}
                excludeSubtreeOf={excludeSubtreeOf}
                requireManage={requireManage}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

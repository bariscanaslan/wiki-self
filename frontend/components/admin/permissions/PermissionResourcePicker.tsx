"use client";

import { ChevronRight, File, Folder } from "lucide-react";
import { useState } from "react";
import { ResourceType, type FolderTreeNode } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export interface SelectedResource {
  type: ResourceType;
  id: string;
  label: string;
}

interface PermissionResourcePickerProps {
  nodes: FolderTreeNode[];
  selected: SelectedResource | null;
  onSelect: (resource: SelectedResource) => void;
  depth?: number;
}

export function PermissionResourcePicker({ nodes, selected, onSelect, depth = 0 }: PermissionResourcePickerProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {nodes.map((node) => (
        <FolderBranch key={node.id} node={node} selected={selected} onSelect={onSelect} depth={depth} />
      ))}
    </div>
  );
}

function FolderBranch({
  node,
  selected,
  onSelect,
  depth,
}: {
  node: FolderTreeNode;
  selected: SelectedResource | null;
  onSelect: (resource: SelectedResource) => void;
  depth: number;
}) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const isSelected = selected?.type === ResourceType.Folder && selected.id === node.id;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm",
          isSelected ? "bg-primary-50 text-primary-700" : "text-zinc-700 hover:bg-zinc-100",
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex h-5 w-5 shrink-0 items-center justify-center text-zinc-400"
        >
          <ChevronRight size={14} className={cn("transition-transform", isExpanded && "rotate-90")} />
        </button>
        <button
          type="button"
          onClick={() => onSelect({ type: ResourceType.Folder, id: node.id, label: node.name })}
          className="flex flex-1 items-center gap-2 truncate text-left"
        >
          <Folder size={14} className="shrink-0 text-zinc-400" />
          <span className="truncate font-medium">{node.name}</span>
        </button>
      </div>

      {isExpanded && (
        <div>
          {node.children.map((child) => (
            <FolderBranch key={child.id} node={child} selected={selected} onSelect={onSelect} depth={depth + 1} />
          ))}
          {node.documents.map((document) => {
            const isDocSelected = selected?.type === ResourceType.Document && selected.id === document.id;
            return (
              <button
                key={document.id}
                type="button"
                onClick={() => onSelect({ type: ResourceType.Document, id: document.id, label: document.title })}
                style={{ paddingLeft: `${(depth + 1) * 16 + 28}px` }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-sm",
                  isDocSelected ? "bg-primary-50 text-primary-700" : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                <File size={13} className="shrink-0 text-zinc-400" />
                <span className="truncate">{document.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

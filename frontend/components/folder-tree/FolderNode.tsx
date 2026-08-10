"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Folder, FolderOpen, MoreVertical } from "lucide-react";
import { useState } from "react";
import { canEdit, canManage } from "../../lib/auth/permissions";
import { cn } from "../../lib/utils/cn";
import type { FolderTreeNode } from "../../lib/types";
import { DropdownItem, DropdownMenu } from "../ui/DropdownMenu";
import { DocumentLeaf } from "./DocumentLeaf";
import { useFolderTreeUI } from "./FolderTreeUIContext";

export function FolderNode({ node, depth }: { node: FolderTreeNode; depth: number }) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const { openModal } = useFolderTreeUI();

  const hasChildren = node.children.length > 0 || node.documents.length > 0;
  const editable = canEdit(node.effectivePermission);
  const manageable = canManage(node.effectivePermission);

  return (
    <div>
      <div
        className="group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex h-5 w-5 shrink-0 items-center justify-center text-zinc-400"
        >
          <motion.span animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight size={14} className={cn(!hasChildren && "opacity-0")} />
          </motion.span>
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex flex-1 items-center gap-2 truncate text-left"
        >
          {isExpanded ? (
            <FolderOpen size={16} className="shrink-0 text-primary-500" />
          ) : (
            <Folder size={16} className="shrink-0 text-zinc-400" />
          )}
          <span className="truncate font-medium">{node.name}</span>
        </button>

        {(editable || manageable) && (
          <DropdownMenu
            trigger={
              <button
                type="button"
                className="rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-200 group-hover:opacity-100"
                aria-label="Klasör işlemleri"
              >
                <MoreVertical size={14} />
              </button>
            }
          >
            {editable && (
              <DropdownItem onClick={() => openModal({ type: "createDocument", parent: node })}>Yeni Doküman</DropdownItem>
            )}
            {manageable && (
              <DropdownItem onClick={() => openModal({ type: "createFolder", parent: node })}>Yeni Alt Klasör</DropdownItem>
            )}
            {manageable && <DropdownItem onClick={() => openModal({ type: "rename", folder: node })}>Yeniden Adlandır</DropdownItem>}
            {manageable && <DropdownItem onClick={() => openModal({ type: "move", folder: node })}>Taşı</DropdownItem>}
            {manageable && (
              <DropdownItem danger onClick={() => openModal({ type: "delete", folder: node })}>
                Sil
              </DropdownItem>
            )}
          </DropdownMenu>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <FolderNode key={child.id} node={child} depth={depth + 1} />
            ))}
            {node.documents.map((doc) => (
              <DocumentLeaf key={doc.id} document={doc} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

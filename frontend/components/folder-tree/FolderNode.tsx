"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, MoreVertical } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../lib/api/client";
import { useMoveDocument } from "../../lib/api/documents";
import { useMoveFolder } from "../../lib/api/folders";
import { canEdit, canManage } from "../../lib/auth/permissions";
import { getFolderIcon } from "../../lib/icons/folderIcons";
import { cn } from "../../lib/utils/cn";
import type { FolderTreeNode } from "../../lib/types";
import { ContextMenu } from "../ui/ContextMenu";
import { DropdownItem, DropdownMenu } from "../ui/DropdownMenu";
import { DOCUMENT_DRAG_MIME_TYPE, DocumentLeaf } from "./DocumentLeaf";
import { useFolderTreeUI } from "./FolderTreeUIContext";

export const FOLDER_DRAG_MIME_TYPE = "application/x-wikiself-folder-id";

export function FolderNode({ node, depth }: { node: FolderTreeNode; depth: number }) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [contextMenuPoint, setContextMenuPoint] = useState<{ x: number; y: number } | null>(null);
  const { openModal, collapseSignal } = useFolderTreeUI();
  const moveDocument = useMoveDocument();
  const moveFolder = useMoveFolder();

  const [lastCollapseSignal, setLastCollapseSignal] = useState(collapseSignal);
  if (collapseSignal !== lastCollapseSignal) {
    setLastCollapseSignal(collapseSignal);
    if (isExpanded) {
      setIsExpanded(false);
    }
  }

  const hasChildren = node.children.length > 0 || node.documents.length > 0;
  const editable = canEdit(node.effectivePermission);
  const manageable = canManage(node.effectivePermission);
  const hasMenu = editable || manageable;

  function handleContextMenu(event: React.MouseEvent) {
    if (!hasMenu) {
      return;
    }
    event.preventDefault();
    setContextMenuPoint({ x: event.clientX, y: event.clientY });
  }

  function renderMenuItems() {
    return (
      <>
        {editable && <DropdownItem onClick={() => openModal({ type: "createDocument", parent: node })}>Yeni Doküman</DropdownItem>}
        {manageable && <DropdownItem onClick={() => openModal({ type: "createFolder", parent: node })}>Yeni Alt Klasör</DropdownItem>}
        {manageable && <DropdownItem onClick={() => openModal({ type: "rename", folder: node })}>Yeniden Adlandır</DropdownItem>}
        {manageable && <DropdownItem onClick={() => openModal({ type: "icon", folder: node })}>Simge Değiştir</DropdownItem>}
        {manageable && <DropdownItem onClick={() => openModal({ type: "move", folder: node })}>Taşı</DropdownItem>}
        {manageable && (
          <DropdownItem danger onClick={() => openModal({ type: "delete", folder: node })}>
            Sil
          </DropdownItem>
        )}
      </>
    );
  }

  function handleFolderDragStart(event: React.DragEvent) {
    if (!manageable) {
      return;
    }
    event.dataTransfer.setData(FOLDER_DRAG_MIME_TYPE, node.id);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(event: React.DragEvent) {
    const types = event.dataTransfer.types;
    const acceptsDocument = editable && types.includes(DOCUMENT_DRAG_MIME_TYPE);
    const acceptsFolder = manageable && types.includes(FOLDER_DRAG_MIME_TYPE);
    if (!acceptsDocument && !acceptsFolder) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  async function handleDrop(event: React.DragEvent) {
    setIsDragOver(false);

    const draggedFolderId = event.dataTransfer.getData(FOLDER_DRAG_MIME_TYPE);
    if (draggedFolderId) {
      if (!manageable) {
        return;
      }
      event.preventDefault();
      if (draggedFolderId === node.id) {
        return;
      }
      try {
        await moveFolder.mutateAsync({ id: draggedFolderId, request: { newParentId: node.id } });
        toast.success("Klasör taşındı");
      } catch (error) {
        toast.error(extractErrorMessage(error));
      }
      return;
    }

    if (!editable) {
      return;
    }
    const documentId = event.dataTransfer.getData(DOCUMENT_DRAG_MIME_TYPE);
    if (!documentId) {
      return;
    }
    event.preventDefault();

    try {
      await moveDocument.mutateAsync({ id: documentId, request: { folderId: node.id } });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100",
          isDragOver && "bg-primary-50 ring-2 ring-inset ring-primary-300",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        draggable={manageable}
        onDragStart={handleFolderDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
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
          <FontAwesomeIcon
            icon={getFolderIcon(node.icon, isExpanded)}
            className={cn("h-4 w-4 shrink-0", isExpanded ? "text-primary-500" : "text-zinc-400")}
          />
          <span className="truncate font-medium">{node.name}</span>
        </button>

        {hasMenu && (
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
            {renderMenuItems()}
          </DropdownMenu>
        )}
      </div>

      {hasMenu && (
        <ContextMenu point={contextMenuPoint} onClose={() => setContextMenuPoint(null)}>
          {renderMenuItems()}
        </ContextMenu>
      )}

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

"use client";

import { FileEdit, FileText, FileType, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../lib/api/client";
import { useDeleteDocument } from "../../lib/api/documents";
import { canManage } from "../../lib/auth/permissions";
import { exportDocument, type ExportFormat } from "../../lib/export/exportDocument";
import { cn } from "../../lib/utils/cn";
import type { DocumentSummary } from "../../lib/types";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { ContextMenu } from "../ui/ContextMenu";
import { DropdownItem } from "../ui/DropdownMenu";

export const DOCUMENT_DRAG_MIME_TYPE = "application/x-wikiself-document-id";

export function DocumentLeaf({ document, depth }: { document: DocumentSummary; depth: number }) {
  const pathname = usePathname();
  const isActive = pathname === `/documents/${document.id}`;
  const manageable = canManage(document.effectivePermission);

  const [contextMenuPoint, setContextMenuPoint] = useState<{ x: number; y: number } | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const deleteDocument = useDeleteDocument();

  function handleDragStart(event: React.DragEvent) {
    event.dataTransfer.setData(DOCUMENT_DRAG_MIME_TYPE, document.id);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleContextMenu(event: React.MouseEvent) {
    event.preventDefault();
    setContextMenuPoint({ x: event.clientX, y: event.clientY });
  }

  async function handleExport(format: ExportFormat) {
    setExportingFormat(format);
    try {
      await exportDocument(document.id, format);
      toast.success("Doküman indirildi");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setExportingFormat(null);
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteDocument.mutateAsync(document.id);
      toast.success("Doküman silindi");
      setIsDeleteOpen(false);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <>
      <Link
        href={`/documents/${document.id}`}
        draggable
        onDragStart={handleDragStart}
        onContextMenu={handleContextMenu}
        style={{ paddingLeft: `${depth * 16 + 28}px` }}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-zinc-100",
          isActive ? "bg-primary-50 font-medium text-primary-700" : "text-zinc-600",
        )}
      >
        <FileText size={14} className="shrink-0 text-zinc-400" />
        <span className="truncate">{document.title}</span>
      </Link>

      <ContextMenu point={contextMenuPoint} onClose={() => setContextMenuPoint(null)}>
        <DropdownItem href={`/documents/${document.id}`}>
          <FileEdit size={14} /> Düzenle
        </DropdownItem>
        <DropdownItem disabled={exportingFormat !== null} onClick={() => handleExport("pdf")}>
          <FileText size={14} /> PDF olarak dışa aktar
        </DropdownItem>
        <DropdownItem disabled={exportingFormat !== null} onClick={() => handleExport("markdown")}>
          <FileText size={14} /> Markdown olarak dışa aktar
        </DropdownItem>
        <DropdownItem disabled={exportingFormat !== null} onClick={() => handleExport("docx")}>
          <FileType size={14} /> Word olarak dışa aktar (.docx)
        </DropdownItem>
        {manageable && (
          <DropdownItem danger onClick={() => setIsDeleteOpen(true)}>
            <Trash2 size={14} /> Sil
          </DropdownItem>
        )}
      </ContextMenu>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Dokümanı sil"
        description={`"${document.title}" dokümanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        isLoading={deleteDocument.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
}


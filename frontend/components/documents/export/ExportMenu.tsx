"use client";

import { Download, FileText, FileType } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../../lib/api/client";
import { exportDocument, type ExportFormat } from "../../../lib/export/exportDocument";
import { DropdownItem, DropdownMenu } from "../../ui/DropdownMenu";

export function ExportMenu({ documentId }: { documentId: string }) {
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  async function handleExport(format: ExportFormat) {
    setExportingFormat(format);

    try {
      await exportDocument(documentId, format);
      toast.success("Doküman indirildi");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setExportingFormat(null);
    }
  }

  const isExporting = exportingFormat !== null;

  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:border-primary-400 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} /> {isExporting ? "İndiriliyor..." : "Dışa Aktar"}
        </button>
      }
    >
      <DropdownItem disabled={isExporting} onClick={() => handleExport("pdf")}>
        <FileText size={16} /> PDF olarak indir
      </DropdownItem>
      <DropdownItem disabled={isExporting} onClick={() => handleExport("markdown")}>
        <FileText size={16} /> Markdown olarak indir
      </DropdownItem>
      <DropdownItem disabled={isExporting} onClick={() => handleExport("docx")}>
        <FileType size={16} /> Word olarak indir (.docx)
      </DropdownItem>
    </DropdownMenu>
  );
}

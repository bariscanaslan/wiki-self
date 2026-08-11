"use client";

import { Download, FileText, FileType } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../../lib/api/client";
import { getExportContent, useLogExport } from "../../../lib/api/documents";
import { renderTiptapDocumentToDocx } from "../../../lib/docx/renderTiptapToDocx";
import { embedPdfFonts } from "../../../lib/pdf/embedFonts";
import { renderTiptapDocumentToPdf, type TiptapNode } from "../../../lib/pdf/renderTiptapToPdf";
import { parseDocumentJson } from "../../../lib/tiptap/extensions";
import { downloadBlob } from "../../../lib/utils/download";
import { DropdownItem, DropdownMenu } from "../../ui/DropdownMenu";

type ExportFormat = "pdf" | "markdown" | "docx";

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, "-").trim();
  return cleaned.length > 0 ? cleaned : "dokuman";
}

export function ExportMenu({ documentId }: { documentId: string }) {
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const logExport = useLogExport();

  async function handleExport(format: ExportFormat) {
    setExportingFormat(format);

    try {
      const content = await getExportContent(documentId);
      const fileName = sanitizeFileName(content.title || "dokuman");

      if (format === "markdown") {
        const blob = new Blob([content.contentMarkdown], { type: "text/markdown;charset=utf-8" });
        downloadBlob(blob, `${fileName}.md`);
      } else if (format === "docx") {
        const parsedDoc = parseDocumentJson(content.contentJson) as unknown as TiptapNode;
        const blob = await renderTiptapDocumentToDocx(parsedDoc);
        downloadBlob(blob, `${fileName}.docx`);
      } else {
        const { default: jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ unit: "pt", format: "a4" });
        await embedPdfFonts(pdf);
        const parsedDoc = parseDocumentJson(content.contentJson) as unknown as TiptapNode;
        await renderTiptapDocumentToPdf(pdf, parsedDoc);
        pdf.save(`${fileName}.pdf`);
      }

      await logExport.mutateAsync({ id: documentId, request: { format } });
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

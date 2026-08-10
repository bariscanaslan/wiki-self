"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../../lib/api/client";
import { getExportContent, useLogExport } from "../../../lib/api/documents";
import { embedPdfFonts } from "../../../lib/pdf/embedFonts";
import { renderTiptapDocumentToPdf, type TiptapNode } from "../../../lib/pdf/renderTiptapToPdf";
import { parseDocumentJson } from "../../../lib/tiptap/extensions";
import { Button } from "../../ui/Button";

export function ExportPdfButton({ documentId }: { documentId: string }) {
  const [isExporting, setIsExporting] = useState(false);
  const logExport = useLogExport();

  async function handleExport() {
    setIsExporting(true);

    try {
      const content = await getExportContent(documentId);
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });

      await embedPdfFonts(pdf);

      const parsedDoc = parseDocumentJson(content.contentJson) as unknown as TiptapNode;
      await renderTiptapDocumentToPdf(pdf, parsedDoc);

      pdf.save(`${content.title || "dokuman"}.pdf`);

      await logExport.mutateAsync({ id: documentId, request: { format: "pdf" } });
      toast.success("PDF indirildi");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} isLoading={isExporting}>
      <Download size={16} /> PDF İndir
    </Button>
  );
}

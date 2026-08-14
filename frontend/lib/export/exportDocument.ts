import { getExportContent, logExport } from "../api/documents";
import { renderTiptapDocumentToDocx } from "../docx/renderTiptapToDocx";
import { embedPdfFonts } from "../pdf/embedFonts";
import { renderTiptapDocumentToPdf, type TiptapNode } from "../pdf/renderTiptapToPdf";
import { parseDocumentJson } from "../tiptap/extensions";
import { downloadBlob } from "../utils/download";

export type ExportFormat = "pdf" | "markdown" | "docx";

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, "-").trim();
  return cleaned.length > 0 ? cleaned : "dokuman";
}

export async function exportDocument(documentId: string, format: ExportFormat): Promise<void> {
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
    const fontFamily = await embedPdfFonts(pdf, content.documentFont);
    const parsedDoc = parseDocumentJson(content.contentJson) as unknown as TiptapNode;
    await renderTiptapDocumentToPdf(pdf, parsedDoc, fontFamily);
    pdf.save(`${fileName}.pdf`);
  }

  await logExport(documentId, { format });
}

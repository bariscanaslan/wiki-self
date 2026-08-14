import type JSZip from "jszip";
import { getExportContent } from "../api/documents";
import { embedPdfFonts } from "../pdf/embedFonts";
import { renderTiptapDocumentToPdf, type TiptapNode } from "../pdf/renderTiptapToPdf";
import { parseDocumentJson } from "../tiptap/extensions";
import type { FolderTreeNode } from "../types";
import { downloadBlob } from "../utils/download";

export type ExportAllFormat = "pdf" | "markdown";

const INVALID_NAME_CHARS = /[\\/:*?"<>|]/g;

function sanitizeName(name: string): string {
  const cleaned = name.replace(INVALID_NAME_CHARS, "-").trim();
  return cleaned.length > 0 ? cleaned : "Adsız";
}

function uniqueName(usedNames: Set<string>, baseName: string): string {
  let candidate = baseName;
  let suffix = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${baseName} (${suffix})`;
    suffix += 1;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

export function countDocuments(nodes: FolderTreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count += node.documents.length;
    count += countDocuments(node.children);
  }
  return count;
}

async function renderDocumentPdf(documentId: string, jsPDFCtor: typeof import("jspdf").default): Promise<{ title: string; blob: Blob }> {
  const content = await getExportContent(documentId);
  const pdf = new jsPDFCtor({ unit: "pt", format: "a4" });
  const fontFamily = await embedPdfFonts(pdf, content.documentFont);

  const parsedDoc = parseDocumentJson(content.contentJson) as unknown as TiptapNode;
  await renderTiptapDocumentToPdf(pdf, parsedDoc, fontFamily);

  return { title: content.title || "dokuman", blob: pdf.output("blob") };
}

async function renderDocumentMarkdown(documentId: string): Promise<{ title: string; blob: Blob }> {
  const content = await getExportContent(documentId);
  const blob = new Blob([content.contentMarkdown], { type: "text/markdown;charset=utf-8" });
  return { title: content.title || "dokuman", blob };
}

async function addFolderContentsToZip(
  zip: JSZip,
  node: FolderTreeNode,
  format: ExportAllFormat,
  jsPDFCtor: typeof import("jspdf").default | null,
  onDocumentExported: () => void,
): Promise<void> {
  const extension = format === "pdf" ? "pdf" : "md";
  const usedFileNames = new Set<string>();
  for (const doc of node.documents) {
    const { title, blob } = format === "pdf" && jsPDFCtor ? await renderDocumentPdf(doc.id, jsPDFCtor) : await renderDocumentMarkdown(doc.id);
    const fileName = `${uniqueName(usedFileNames, sanitizeName(title))}.${extension}`;
    zip.file(fileName, blob);
    onDocumentExported();
  }

  const usedFolderNames = new Set<string>();
  for (const child of node.children) {
    const folderName = uniqueName(usedFolderNames, sanitizeName(child.name));
    const childZip = zip.folder(folderName);
    if (childZip) {
      await addFolderContentsToZip(childZip, child, format, jsPDFCtor, onDocumentExported);
    }
  }
}

export async function exportAllAsZip(
  tree: FolderTreeNode[],
  format: ExportAllFormat,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const [{ default: JSZipCtor }, jsPDFCtor] = await Promise.all([
    import("jszip"),
    format === "pdf" ? import("jspdf").then((mod) => mod.default) : Promise.resolve(null),
  ]);

  const zip = new JSZipCtor();
  const total = countDocuments(tree);
  let done = 0;

  const usedFolderNames = new Set<string>();
  for (const node of tree) {
    const folderName = uniqueName(usedFolderNames, sanitizeName(node.name));
    const folderZip = zip.folder(folderName);
    if (folderZip) {
      await addFolderContentsToZip(folderZip, node, format, jsPDFCtor, () => {
        done += 1;
        onProgress?.(done, total);
      });
    }
  }

  return zip.generateAsync({ type: "blob" });
}

export { downloadBlob };

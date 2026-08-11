import type JSZip from "jszip";
import { getExportContent } from "../api/documents";
import { embedPdfFonts } from "../pdf/embedFonts";
import { renderTiptapDocumentToPdf, type TiptapNode } from "../pdf/renderTiptapToPdf";
import { parseDocumentJson } from "../tiptap/extensions";
import type { FolderTreeNode } from "../types";
import { downloadBlob } from "../utils/download";

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
  await embedPdfFonts(pdf);

  const parsedDoc = parseDocumentJson(content.contentJson) as unknown as TiptapNode;
  await renderTiptapDocumentToPdf(pdf, parsedDoc);

  return { title: content.title || "dokuman", blob: pdf.output("blob") };
}

async function addFolderContentsToZip(
  zip: JSZip,
  node: FolderTreeNode,
  jsPDFCtor: typeof import("jspdf").default,
  onDocumentExported: () => void,
): Promise<void> {
  const usedFileNames = new Set<string>();
  for (const doc of node.documents) {
    const { title, blob } = await renderDocumentPdf(doc.id, jsPDFCtor);
    const fileName = `${uniqueName(usedFileNames, sanitizeName(title))}.pdf`;
    zip.file(fileName, blob);
    onDocumentExported();
  }

  const usedFolderNames = new Set<string>();
  for (const child of node.children) {
    const folderName = uniqueName(usedFolderNames, sanitizeName(child.name));
    const childZip = zip.folder(folderName);
    if (childZip) {
      await addFolderContentsToZip(childZip, child, jsPDFCtor, onDocumentExported);
    }
  }
}

export async function exportAllAsZip(tree: FolderTreeNode[], onProgress?: (done: number, total: number) => void): Promise<Blob> {
  const [{ default: JSZipCtor }, { default: jsPDFCtor }] = await Promise.all([import("jszip"), import("jspdf")]);

  const zip = new JSZipCtor();
  const total = countDocuments(tree);
  let done = 0;

  const usedFolderNames = new Set<string>();
  for (const node of tree) {
    const folderName = uniqueName(usedFolderNames, sanitizeName(node.name));
    const folderZip = zip.folder(folderName);
    if (folderZip) {
      await addFolderContentsToZip(folderZip, node, jsPDFCtor, () => {
        done += 1;
        onProgress?.(done, total);
      });
    }
  }

  return zip.generateAsync({ type: "blob" });
}

export { downloadBlob };

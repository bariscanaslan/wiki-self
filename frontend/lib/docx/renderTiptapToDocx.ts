import {
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type FileChild,
  type ParagraphChild,
} from "docx";
import type { TiptapMark, TiptapNode } from "../pdf/renderTiptapToPdf";

const BODY_SIZE = 22; // half-points (11pt), matches the PDF renderer's body size
const HEADING_SIZES: Record<number, number> = { 1: 44, 2: 36, 3: 30, 4: 26, 5: 24, 6: 22 };
const HEADING_LEVELS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
];
const TEXT_COLOR = "18181B";
const LINK_COLOR = "DC2626";
const CODE_BG_COLOR = "18181B";
const CODE_TEXT_COLOR = "F4F4F5";
const QUOTE_BAR_COLOR = "FCA5A5";
const QUOTE_BG_COLOR = "FAFAFA";
const HR_COLOR = "E4E4E7";
const CODE_FONT = "Consolas";
const CODE_SIZE = 19; // half-points (9.5pt), matches the PDF renderer's code size
const LIST_INDENT = 360; // twips (~0.25in) per nesting level
const QUOTE_INDENT = 360;
const MAX_IMAGE_WIDTH = 600; // px

interface RunSpec {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
  href?: string;
  isBreak?: boolean;
}

const SUPPORTED_IMAGE_TYPES = new Set(["jpg", "png", "gif", "bmp"]);

function extractRuns(nodes: TiptapNode[] | undefined): RunSpec[] {
  if (!nodes) {
    return [];
  }

  const runs: RunSpec[] = [];
  for (const node of nodes) {
    if (node.type === "text" && node.text) {
      const marks: TiptapMark[] = node.marks ?? [];
      const linkMark = marks.find((mark) => mark.type === "link");
      runs.push({
        text: node.text,
        bold: marks.some((mark) => mark.type === "bold"),
        italic: marks.some((mark) => mark.type === "italic"),
        code: marks.some((mark) => mark.type === "code"),
        href: linkMark ? (linkMark.attrs?.href as string | undefined) : undefined,
      });
    } else if (node.type === "hardBreak") {
      runs.push({ text: "", bold: false, italic: false, code: false, isBreak: true });
    }
  }
  return runs;
}

function buildRunChildren(runs: RunSpec[]): ParagraphChild[] {
  if (runs.length === 0) {
    return [new TextRun({ text: "" })];
  }

  const children: ParagraphChild[] = [];
  for (const run of runs) {
    if (run.isBreak) {
      children.push(new TextRun({ text: "", break: 1 }));
      continue;
    }

    const textRun = new TextRun({
      text: run.text,
      bold: run.bold,
      italics: run.italic,
      color: run.href ? LINK_COLOR : TEXT_COLOR,
      font: run.code ? CODE_FONT : undefined,
      size: BODY_SIZE,
    });

    children.push(run.href ? new ExternalHyperlink({ link: run.href, children: [textRun] }) : textRun);
  }
  return children;
}

interface LoadedImage {
  data: ArrayBuffer;
  type: "jpg" | "png" | "gif" | "bmp";
  width: number;
  height: number;
}

async function readImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Görsel yüklenemedi"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function convertToPng(blob: Blob, width: number, height: number): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Görsel dönüştürülemedi"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas oluşturulamadı");
    }
    ctx.drawImage(img, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("PNG dönüştürme başarısız"))), "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function docxTypeForMime(mimeType: string): "jpg" | "png" | "gif" | "bmp" | null {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return "jpg";
  }
  if (mimeType === "image/png") {
    return "png";
  }
  if (mimeType === "image/gif") {
    return "gif";
  }
  if (mimeType === "image/bmp") {
    return "bmp";
  }
  return null;
}

async function loadImage(src: string): Promise<LoadedImage | null> {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    const dimensions = await readImageDimensions(blob);

    let type = docxTypeForMime(blob.type);
    let dataBlob = blob;

    // docx only embeds jpg/png/gif/bmp (or svg with a fallback) — re-encode anything else (e.g. webp) as PNG.
    if (!type || !SUPPORTED_IMAGE_TYPES.has(type)) {
      dataBlob = await convertToPng(blob, dimensions.width, dimensions.height);
      type = "png";
    }

    const data = await dataBlob.arrayBuffer();
    return { data, type, width: dimensions.width, height: dimensions.height };
  } catch {
    return null;
  }
}

function scaleToMaxWidth(width: number, height: number, maxWidth: number): { width: number; height: number } {
  if (width <= maxWidth || width === 0) {
    return { width: width || 1, height: height || 1 };
  }
  const scale = maxWidth / width;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

async function renderBlock(node: TiptapNode, indent = 0): Promise<FileChild[]> {
  switch (node.type) {
    case "paragraph": {
      const runs = extractRuns(node.content);
      return [
        new Paragraph({
          children: buildRunChildren(runs),
          indent: indent ? { left: indent } : undefined,
          spacing: { after: 160 },
        }),
      ];
    }

    case "heading": {
      const level = Number(node.attrs?.level ?? 1);
      const headingLevel = HEADING_LEVELS[level - 1] ?? HeadingLevel.HEADING_3;
      const size = HEADING_SIZES[level] ?? HEADING_SIZES[3];
      const runs = extractRuns(node.content);

      const children: ParagraphChild[] =
        runs.length === 0
          ? [new TextRun({ text: "", bold: true, size, color: TEXT_COLOR })]
          : runs.map((run) =>
              run.isBreak
                ? new TextRun({ text: "", break: 1 })
                : new TextRun({ text: run.text, bold: true, italics: run.italic, size, color: TEXT_COLOR }),
            );

      return [new Paragraph({ heading: headingLevel, children, spacing: { before: 240, after: 120 } })];
    }

    case "bulletList":
    case "orderedList": {
      const startIndex = Number(node.attrs?.start ?? 1);
      let index = startIndex;
      const result: FileChild[] = [];

      for (const item of node.content ?? []) {
        const marker = node.type === "orderedList" ? `${index}.` : "•";
        const itemBlocks = item.content ?? [];
        const [firstBlock, ...restBlocks] = itemBlocks;

        if (firstBlock) {
          const runs = extractRuns(firstBlock.content);
          result.push(
            new Paragraph({
              indent: { left: indent + LIST_INDENT },
              spacing: { after: 80 },
              children: [new TextRun({ text: `${marker} `, size: BODY_SIZE, color: TEXT_COLOR }), ...buildRunChildren(runs)],
            }),
          );
        }

        for (const block of restBlocks) {
          result.push(...(await renderBlock(block, indent + LIST_INDENT)));
        }

        index += 1;
      }

      return result;
    }

    case "blockquote": {
      const result: FileChild[] = [];

      for (const child of node.content ?? []) {
        if (child.type === "paragraph") {
          const runs = extractRuns(child.content).map((run) => ({ ...run, italic: true }));
          result.push(
            new Paragraph({
              indent: { left: indent + QUOTE_INDENT },
              spacing: { after: 160 },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: QUOTE_BG_COLOR },
              border: { left: { style: BorderStyle.SINGLE, size: 18, color: QUOTE_BAR_COLOR, space: 8 } },
              children: buildRunChildren(runs),
            }),
          );
        } else {
          result.push(...(await renderBlock(child, indent + QUOTE_INDENT)));
        }
      }

      return result;
    }

    case "codeBlock": {
      const text = (node.content ?? []).map((child) => child.text ?? "").join("");
      const lines = text.length > 0 ? text.split("\n") : [""];

      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { type: ShadingType.CLEAR, color: "auto", fill: CODE_BG_COLOR },
                  margins: { top: 120, bottom: 120, left: 160, right: 160 },
                  children: lines.map(
                    (line) =>
                      new Paragraph({
                        children: [new TextRun({ text: line || " ", font: CODE_FONT, size: CODE_SIZE, color: CODE_TEXT_COLOR })],
                      }),
                  ),
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "", spacing: { after: 120 } }),
      ];
    }

    case "image": {
      const src = node.attrs?.src as string | undefined;
      if (!src) {
        return [];
      }

      const image = await loadImage(src);
      if (!image) {
        return [];
      }

      const { width, height } = scaleToMaxWidth(image.width, image.height, MAX_IMAGE_WIDTH);

      return [
        new Paragraph({
          spacing: { before: 120, after: 160 },
          children: [new ImageRun({ type: image.type, data: image.data, transformation: { width, height } })],
        }),
      ];
    }

    case "horizontalRule": {
      return [
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: HR_COLOR, space: 4 } },
          spacing: { before: 120, after: 120 },
          children: [],
        }),
      ];
    }

    default: {
      const result: FileChild[] = [];
      for (const child of node.content ?? []) {
        result.push(...(await renderBlock(child, indent)));
      }
      return result;
    }
  }
}

export async function renderTiptapDocumentToDocx(doc: TiptapNode): Promise<Blob> {
  const children: FileChild[] = [];
  for (const node of doc.content ?? []) {
    children.push(...(await renderBlock(node)));
  }

  const document = new Document({
    sections: [
      {
        properties: {},
        children: children.length > 0 ? children : [new Paragraph({ text: "" })],
      },
    ],
  });

  return Packer.toBlob(document);
}

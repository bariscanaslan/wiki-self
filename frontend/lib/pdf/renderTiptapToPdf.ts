import type { jsPDF } from "jspdf";
import { DEFAULT_PDF_FONT_FAMILY } from "./embedFonts";

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

interface Span {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
  href?: string;
  isBreak?: boolean;
}

interface WordToken {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
  href?: string;
  isBreak?: boolean;
}

interface RenderContext {
  pdf: jsPDF;
  cursorY: number;
  pageHeight: number;
  contentWidth: number;
  fontFamily: string;
}

interface LoadedImage {
  dataUrl: string;
  format: "PNG" | "JPEG" | "WEBP";
  width: number;
  height: number;
}

const PAGE_MARGIN = 48;
const CONTENT_TOP_OFFSET = 14;
const BODY_FONT_SIZE = 11;
const HEADING_FONT_SIZES: Record<number, number> = { 1: 22, 2: 18, 3: 15, 4: 13, 5: 12, 6: 11 };
const LINE_HEIGHT_FACTOR = 1.45;
const PARAGRAPH_SPACING = 8;
const LIST_INDENT = 16;
const QUOTE_INDENT = 14;
const CODE_FONT_SIZE = 9.5;
const TEXT_COLOR: [number, number, number] = [24, 24, 27];
const LINK_COLOR: [number, number, number] = [220, 38, 38];

function ensureSpace(ctx: RenderContext, neededHeight: number): void {
  if (ctx.cursorY + neededHeight > ctx.pageHeight - PAGE_MARGIN) {
    ctx.pdf.addPage();
    ctx.cursorY = PAGE_MARGIN + CONTENT_TOP_OFFSET;
  }
}

function extractSpans(nodes: TiptapNode[] | undefined): Span[] {
  if (!nodes) {
    return [];
  }

  const spans: Span[] = [];
  for (const node of nodes) {
    if (node.type === "text" && node.text) {
      const marks = node.marks ?? [];
      const linkMark = marks.find((mark) => mark.type === "link");
      spans.push({
        text: node.text,
        bold: marks.some((mark) => mark.type === "bold"),
        italic: marks.some((mark) => mark.type === "italic"),
        code: marks.some((mark) => mark.type === "code"),
        href: linkMark ? (linkMark.attrs?.href as string | undefined) : undefined,
      });
    } else if (node.type === "hardBreak") {
      spans.push({ text: "", bold: false, italic: false, code: false, isBreak: true });
    }
  }
  return spans;
}

function spansToWords(spans: Span[]): WordToken[] {
  const words: WordToken[] = [];
  for (const span of spans) {
    if (span.isBreak) {
      words.push({ text: "", bold: false, italic: false, code: false, isBreak: true });
      continue;
    }

    const parts = span.text.split(/\s+/).filter((part) => part.length > 0);
    for (const part of parts) {
      words.push({ text: part, bold: span.bold, italic: span.italic, code: span.code, href: span.href });
    }
  }
  return words;
}

function fontStyleForWord(word: WordToken): string {
  if (word.bold && word.italic) {
    return "bolditalic";
  }
  if (word.bold) {
    return "bold";
  }
  if (word.italic) {
    return "italic";
  }
  return "normal";
}

function setFontForWord(ctx: RenderContext, word: WordToken, fontSize: number): void {
  ctx.pdf.setFont(ctx.fontFamily, fontStyleForWord(word));
  ctx.pdf.setFontSize(fontSize);
}

function renderInline(
  ctx: RenderContext,
  words: WordToken[],
  x: number,
  maxWidth: number,
  fontSize: number,
  color: [number, number, number] = TEXT_COLOR,
): void {
  if (words.length === 0) {
    return;
  }

  const lineHeight = fontSize * LINE_HEIGHT_FACTOR;
  ctx.pdf.setFont(ctx.fontFamily, "normal");
  ctx.pdf.setFontSize(fontSize);
  const spaceWidth = ctx.pdf.getTextWidth(" ");

  let line: { word: WordToken; width: number }[] = [];
  let lineWidth = 0;

  function flushLine(): void {
    if (line.length === 0) {
      return;
    }

    ensureSpace(ctx, lineHeight);
    let drawX = x;
    for (const { word, width } of line) {
      setFontForWord(ctx, word, fontSize);
      ctx.pdf.setTextColor(...(word.href ? LINK_COLOR : color));
      ctx.pdf.text(word.text, drawX, ctx.cursorY);
      if (word.href) {
        ctx.pdf.link(drawX, ctx.cursorY - fontSize * 0.8, width, fontSize * 1.1, { url: word.href });
      }
      drawX += width + spaceWidth;
    }
    ctx.cursorY += lineHeight;
    line = [];
    lineWidth = 0;
  }

  for (const word of words) {
    if (word.isBreak) {
      flushLine();
      continue;
    }

    setFontForWord(ctx, word, fontSize);
    const width = ctx.pdf.getTextWidth(word.text);

    if (lineWidth + width > maxWidth && line.length > 0) {
      flushLine();
    }

    line.push({ word, width });
    lineWidth += width + spaceWidth;
  }

  flushLine();
  ctx.pdf.setTextColor(...TEXT_COLOR);
}

function inferImageFormat(dataUrl: string): "PNG" | "JPEG" | "WEBP" {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    return "JPEG";
  }
  if (dataUrl.startsWith("data:image/webp")) {
    return "WEBP";
  }
  return "PNG";
}

async function loadImageAsDataUrl(src: string): Promise<LoadedImage | null> {
  try {
    const response = await fetch(src);
    const blob = await response.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Görsel yüklenemedi"));
      img.src = dataUrl;
    });

    return { dataUrl, format: inferImageFormat(dataUrl), ...dimensions };
  } catch {
    return null;
  }
}

async function renderBlock(ctx: RenderContext, node: TiptapNode, indent = 0): Promise<void> {
  const x = PAGE_MARGIN + indent;
  const maxWidth = ctx.contentWidth - indent;

  switch (node.type) {
    case "paragraph": {
      const words = spansToWords(extractSpans(node.content));
      if (words.length === 0) {
        ctx.cursorY += BODY_FONT_SIZE * LINE_HEIGHT_FACTOR * 0.6;
        return;
      }
      renderInline(ctx, words, x, maxWidth, BODY_FONT_SIZE);
      ctx.cursorY += PARAGRAPH_SPACING;
      return;
    }
    case "heading": {
      const level = Number(node.attrs?.level ?? 1);
      const fontSize = HEADING_FONT_SIZES[level] ?? HEADING_FONT_SIZES[3];
      ensureSpace(ctx, fontSize * LINE_HEIGHT_FACTOR + 10);
      ctx.cursorY += 8;
      const words = spansToWords(extractSpans(node.content)).map((word) => ({ ...word, bold: true }));
      renderInline(ctx, words, x, maxWidth, fontSize);
      ctx.cursorY += 6;
      return;
    }
    case "bulletList":
    case "orderedList": {
      const startIndex = Number(node.attrs?.start ?? 1);
      let index = startIndex;
      for (const item of node.content ?? []) {
        const marker = node.type === "orderedList" ? `${index}.` : "-";
        ensureSpace(ctx, BODY_FONT_SIZE * LINE_HEIGHT_FACTOR);
        ctx.pdf.setFont(ctx.fontFamily, "normal");
        ctx.pdf.setFontSize(BODY_FONT_SIZE);
        ctx.pdf.setTextColor(...TEXT_COLOR);
        ctx.pdf.text(marker, x, ctx.cursorY);
        for (const child of item.content ?? []) {
          await renderBlock(ctx, child, indent + LIST_INDENT);
        }
        index += 1;
      }
      return;
    }
    case "blockquote": {
      const startY = ctx.cursorY;
      for (const child of node.content ?? []) {
        await renderBlock(ctx, child, indent + QUOTE_INDENT);
      }
      ctx.pdf.setDrawColor(252, 165, 165);
      ctx.pdf.setLineWidth(2);
      ctx.pdf.line(x + 2, startY - BODY_FONT_SIZE, x + 2, ctx.cursorY - PARAGRAPH_SPACING);
      return;
    }
    case "codeBlock": {
      const text = (node.content ?? []).map((child) => child.text ?? "").join("");
      ctx.pdf.setFont(ctx.fontFamily, "normal");
      ctx.pdf.setFontSize(CODE_FONT_SIZE);
      const lines = ctx.pdf.splitTextToSize(text, maxWidth - 16) as string[];
      const blockHeight = lines.length * CODE_FONT_SIZE * LINE_HEIGHT_FACTOR + 16;
      ensureSpace(ctx, blockHeight);
      ctx.pdf.setFillColor(24, 24, 27);
      ctx.pdf.rect(x, ctx.cursorY - CODE_FONT_SIZE, maxWidth, blockHeight, "F");
      ctx.pdf.setTextColor(244, 244, 245);
      let lineY = ctx.cursorY + 6;
      for (const line of lines) {
        ctx.pdf.text(line, x + 8, lineY);
        lineY += CODE_FONT_SIZE * LINE_HEIGHT_FACTOR;
      }
      ctx.cursorY = lineY + 6;
      ctx.pdf.setTextColor(...TEXT_COLOR);
      return;
    }
    case "image": {
      const src = node.attrs?.src as string | undefined;
      if (!src) {
        return;
      }
      const image = await loadImageAsDataUrl(src);
      if (!image) {
        return;
      }
      const naturalWidthPt = image.width * 0.75;
      const naturalHeightPt = image.height * 0.75;
      const scale = Math.min(1, maxWidth / naturalWidthPt);
      const drawWidth = naturalWidthPt * scale;
      const drawHeight = naturalHeightPt * scale;
      ensureSpace(ctx, drawHeight + PARAGRAPH_SPACING);
      ctx.pdf.addImage(image.dataUrl, image.format, x, ctx.cursorY - BODY_FONT_SIZE, drawWidth, drawHeight);
      ctx.cursorY += drawHeight + PARAGRAPH_SPACING;
      return;
    }
    case "horizontalRule": {
      ensureSpace(ctx, 16);
      ctx.pdf.setDrawColor(228, 228, 231);
      ctx.pdf.setLineWidth(1);
      ctx.pdf.line(x, ctx.cursorY, x + maxWidth, ctx.cursorY);
      ctx.cursorY += 16;
      return;
    }
    default: {
      for (const child of node.content ?? []) {
        await renderBlock(ctx, child, indent);
      }
    }
  }
}

export async function renderTiptapDocumentToPdf(
  pdf: jsPDF,
  doc: TiptapNode,
  fontFamily: string = DEFAULT_PDF_FONT_FAMILY,
): Promise<void> {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const ctx: RenderContext = {
    pdf,
    cursorY: PAGE_MARGIN + CONTENT_TOP_OFFSET,
    pageHeight,
    contentWidth: pageWidth - PAGE_MARGIN * 2,
    fontFamily,
  };

  for (const node of doc.content ?? []) {
    await renderBlock(ctx, node);
  }
}

import type { jsPDF } from "jspdf";

const FONT_FILES: Record<"normal" | "bold" | "italic" | "bolditalic", string> = {
  normal: "/fonts/PTSans-Regular.ttf",
  bold: "/fonts/PTSans-Bold.ttf",
  italic: "/fonts/PTSans-Italic.ttf",
  bolditalic: "/fonts/PTSans-BoldItalic.ttf",
};

export const PDF_FONT_FAMILY = "PTSans";

async function fetchFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export async function embedPdfFonts(pdf: jsPDF): Promise<void> {
  const entries = Object.entries(FONT_FILES) as [keyof typeof FONT_FILES, string][];

  await Promise.all(
    entries.map(async ([style, url]) => {
      const base64 = await fetchFontAsBase64(url);
      const fileName = `${PDF_FONT_FAMILY}-${style}.ttf`;
      pdf.addFileToVFS(fileName, base64);
      pdf.addFont(fileName, PDF_FONT_FAMILY, style);
    }),
  );
}

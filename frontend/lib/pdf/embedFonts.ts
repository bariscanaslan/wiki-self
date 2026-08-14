import type { jsPDF } from "jspdf";
import type { FontName } from "../settings/fonts";

type FontStyle = "normal" | "bold" | "italic" | "bolditalic";

export const DEFAULT_PDF_FONT_FAMILY = "PTSans";

const PDF_FONT_FILES: Record<FontName | "PTSans", Record<FontStyle, string>> = {
  PTSans: {
    normal: "/fonts/PTSans-Regular.ttf",
    bold: "/fonts/PTSans-Bold.ttf",
    italic: "/fonts/PTSans-Italic.ttf",
    bolditalic: "/fonts/PTSans-BoldItalic.ttf",
  },
  Inter: {
    normal: "/fonts/Inter-Regular.ttf",
    bold: "/fonts/Inter-Bold.ttf",
    italic: "/fonts/Inter-Italic.ttf",
    bolditalic: "/fonts/Inter-BoldItalic.ttf",
  },
  Roboto: {
    normal: "/fonts/Roboto-Regular.ttf",
    bold: "/fonts/Roboto-Bold.ttf",
    italic: "/fonts/Roboto-Italic.ttf",
    bolditalic: "/fonts/Roboto-BoldItalic.ttf",
  },
  Merriweather: {
    normal: "/fonts/Merriweather-Regular.ttf",
    bold: "/fonts/Merriweather-Bold.ttf",
    italic: "/fonts/Merriweather-Italic.ttf",
    bolditalic: "/fonts/Merriweather-BoldItalic.ttf",
  },
  Lora: {
    normal: "/fonts/Lora-Regular.ttf",
    bold: "/fonts/Lora-Bold.ttf",
    italic: "/fonts/Lora-Italic.ttf",
    bolditalic: "/fonts/Lora-BoldItalic.ttf",
  },
  Poppins: {
    normal: "/fonts/Poppins-Regular.ttf",
    bold: "/fonts/Poppins-Bold.ttf",
    italic: "/fonts/Poppins-Italic.ttf",
    bolditalic: "/fonts/Poppins-BoldItalic.ttf",
  },
};

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

export async function embedPdfFonts(pdf: jsPDF, documentFont?: string | null): Promise<string> {
  const fontFamily = documentFont && documentFont in PDF_FONT_FILES ? (documentFont as FontName) : DEFAULT_PDF_FONT_FAMILY;
  const entries = Object.entries(PDF_FONT_FILES[fontFamily]) as [FontStyle, string][];

  await Promise.all(
    entries.map(async ([style, url]) => {
      const base64 = await fetchFontAsBase64(url);
      const fileName = `${fontFamily}-${style}.ttf`;
      pdf.addFileToVFS(fileName, base64);
      pdf.addFont(fileName, fontFamily, style);
    }),
  );

  return fontFamily;
}

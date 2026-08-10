export const AVAILABLE_FONTS = ["Inter", "Roboto", "Merriweather", "Lora", "Poppins"] as const;

export type FontName = (typeof AVAILABLE_FONTS)[number];

export const FONT_VARIABLE_MAP: Record<FontName, string> = {
  Inter: "var(--font-inter)",
  Roboto: "var(--font-roboto)",
  Merriweather: "var(--font-merriweather)",
  Lora: "var(--font-lora)",
  Poppins: "var(--font-poppins)",
};

export function resolveFontVariable(fontName: string | undefined | null): string {
  if (fontName && fontName in FONT_VARIABLE_MAP) {
    return FONT_VARIABLE_MAP[fontName as FontName];
  }
  return FONT_VARIABLE_MAP.Inter;
}

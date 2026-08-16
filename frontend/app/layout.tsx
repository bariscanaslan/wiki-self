import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import type { Metadata } from "next";
import { Inter, Roboto, Merriweather, Lora, Poppins } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "../components/providers/Providers";

fontAwesomeConfig.autoAddCss = false;

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto", display: "swap" });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-merriweather", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });

export const metadata: Metadata = {
  title: "WikiSelf",
  description: "Self-hosted documentation platform",

  icons: {
    icon: [
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },

  manifest: "/site.webmanifest",

  appleWebApp: {
    title: "WikiSelf",
  },
};

// Keep the forced-light path check ("/login", "/setup") in sync with FORCED_LIGHT_PREFIXES in lib/theme/ThemeContext.tsx.
const THEME_INIT_SCRIPT = `(function(){try{if(/^\\/(login|setup)(\\/|$)/.test(window.location.pathname))return;var s=localStorage.getItem('wikiself.theme');var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${inter.variable} ${roboto.variable} ${merriweather.variable} ${lora.variable} ${poppins.variable}`}
    >
      <head>
        {/* Applied before hydration so the correct theme paints on first frame instead of flashing light. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

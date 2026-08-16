"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "wikiself.theme";

// Pre-auth pages always render in light theme, regardless of the visitor's preference —
// keep this in sync with the FORCED_LIGHT_PREFIXES check in app/layout.tsx's no-flash script.
const FORCED_LIGHT_PREFIXES = ["/login", "/setup"];

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function isForcedLightRoute(pathname: string): boolean {
  return FORCED_LIGHT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const forcedLight = isForcedLightRoute(pathname ?? "");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    if (forcedLight) {
      applyTheme("light");
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const hasExplicitChoice = stored === "light" || stored === "dark";
    const initial = hasExplicitChoice ? (stored as Theme) : getSystemTheme();

    // Sync React state with the theme the inline no-flash script (app/layout.tsx) already
    // applied to <html> before hydration, so this only matches on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial);
    applyTheme(initial);

    if (hasExplicitChoice) {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      const next: Theme = event.matches ? "dark" : "light";
      setTheme(next);
      applyTheme(next);
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [forcedLight]);

  const toggleTheme = useCallback(() => {
    if (forcedLight) {
      return;
    }
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, [forcedLight]);

  return <ThemeContext.Provider value={{ theme: forcedLight ? "light" : theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

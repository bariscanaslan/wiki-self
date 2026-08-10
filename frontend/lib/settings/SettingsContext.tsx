"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { resolveAssetUrl } from "../api/client";
import { useSettings } from "../api/settings";
import { resolveFontVariable } from "./fonts";
import type { SiteSettingsResponse } from "../types";

interface SettingsContextValue {
  settings: SiteSettingsResponse | undefined;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function upsertHeadTag(selector: string, tagName: string, attributes: Record<string, string>) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement(tagName);
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useSettings();

  useEffect(() => {
    if (!settings) {
      return;
    }

    document.title = settings.siteTitle || "WikiSelf";

    upsertHeadTag('meta[name="description"]', "meta", {
      name: "description",
      content: settings.metaDescription ?? "",
    });

    const faviconUrl = resolveAssetUrl(settings.faviconUrl);
    if (faviconUrl) {
      upsertHeadTag('link[rel="icon"]', "link", { rel: "icon", href: faviconUrl });
    }

    document.documentElement.style.setProperty("--ui-font-active", resolveFontVariable(settings.uiFont));
    document.documentElement.style.setProperty("--document-font-active", resolveFontVariable(settings.documentFont));
  }, [settings]);

  return <SettingsContext.Provider value={{ settings, isLoading }}>{children}</SettingsContext.Provider>;
}

export function useSiteSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSiteSettings must be used within a SettingsProvider");
  }
  return context;
}

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

function applyFavicon(href: string) {
  const iconLinks = document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]');

  if (iconLinks.length === 0) {
    const link = document.createElement("link");
    link.setAttribute("rel", "icon");
    link.setAttribute("href", href);
    document.head.appendChild(link);
    return;
  }

  // Mutate every existing icon link in place (rather than removing/recreating nodes) since
  // Next's App Router head-metadata manager still owns and tracks these DOM nodes; detaching
  // them causes a "Cannot read properties of null (reading 'removeChild')" crash on the next
  // client-side navigation when Next reconciles the head.
  iconLinks.forEach((link) => {
    link.setAttribute("href", href);
    link.removeAttribute("type");
    link.removeAttribute("sizes");
  });
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
      applyFavicon(faviconUrl);
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

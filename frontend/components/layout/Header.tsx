"use client";

import Link from "next/link";
import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun, X } from "lucide-react";
import { resolveAssetUrl } from "../../lib/api/client";
import { useSiteSettings } from "../../lib/settings/SettingsContext";
import { useTheme } from "../../lib/theme/ThemeContext";
import { SearchBox } from "../search/SearchBox";
import { UserMenu } from "./UserMenu";

type HeaderProps = {
  isMobileSidebarOpen: boolean;
  onMobileSidebarToggle: () => void;
  isSidebarCollapsed: boolean;
  onSidebarCollapsedToggle: () => void;
};

export function Header({
  isMobileSidebarOpen,
  onMobileSidebarToggle,
  isSidebarCollapsed,
  onSidebarCollapsedToggle,
}: HeaderProps) {
  const { settings } = useSiteSettings();
  const logoUrl = resolveAssetUrl(settings?.logoUrl);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-100 bg-white px-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900 md:gap-4">
      <button
        type="button"
        onClick={onMobileSidebarToggle}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 md:hidden"
        aria-label={isMobileSidebarOpen ? "Menüyü kapat" : "Menüyü aç"}
        aria-controls="mobile-sidebar"
        aria-expanded={isMobileSidebarOpen}
      >
        {isMobileSidebarOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      <button
        type="button"
        onClick={onSidebarCollapsedToggle}
        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 md:flex"
        aria-label={isSidebarCollapsed ? "Kenar çubuğunu göster" : "Kenar çubuğunu gizle"}
      >
        {isSidebarCollapsed ? (
          <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
        ) : (
          <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      <Link href="/" className="flex shrink-0 items-center gap-2.5">
        {logoUrl ? (
          <img src={logoUrl} alt={settings?.companyName ?? "Logo"} className="h-9 w-9 rounded-lg object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            {(settings?.companyName ?? "W").charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:block">
          {settings?.siteTitle || settings?.companyName || "WikiSelf"}
        </span>
      </Link>

      <div className="min-w-0 max-w-xl flex-1">
        <SearchBox />
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label={theme === "dark" ? "Aydınlık moda geç" : "Karanlık moda geç"}
      >
        {theme === "dark" ? <Moon className="h-5 w-5" aria-hidden="true" /> : <Sun className="h-5 w-5" aria-hidden="true" />}
      </button>

      <UserMenu />
    </header>
  );
}

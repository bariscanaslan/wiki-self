"use client";

import Link from "next/link";
import { resolveAssetUrl } from "../../lib/api/client";
import { useSiteSettings } from "../../lib/settings/SettingsContext";
import { SearchBox } from "../search/SearchBox";
import { UserMenu } from "./UserMenu";

export function Header() {
  const { settings } = useSiteSettings();
  const logoUrl = resolveAssetUrl(settings?.logoUrl);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-zinc-100 bg-white px-4 sm:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-2.5">
        {logoUrl ? (
          <img src={logoUrl} alt={settings?.companyName ?? "Logo"} className="h-9 w-9 rounded-lg object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            {(settings?.companyName ?? "W").charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden text-sm font-semibold text-zinc-900 sm:block">
          {settings?.siteTitle || settings?.companyName || "WikiSelf"}
        </span>
      </Link>

      <div className="max-w-xl flex-1">
        <SearchBox />
      </div>

      <UserMenu />
    </header>
  );
}

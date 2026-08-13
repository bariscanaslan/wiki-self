"use client";

import { Suspense } from "react";
import { useResizableWidth } from "../../lib/hooks/useResizableWidth";
import { FolderTree } from "../folder-tree/FolderTree";
import { ImageGallerySection } from "./ImageGallerySection";
import { TagFilterSection } from "./TagFilterSection";

type SidebarProps = {
  isMobileOpen: boolean;
  onMobileClose: () => void;
};

const SIDEBAR_MIN_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 480;
const SIDEBAR_DEFAULT_WIDTH = 288;

function SidebarContent() {
  return (
    <>
      <FolderTree />
      <Suspense fallback={null}>
        <TagFilterSection />
      </Suspense>
      <ImageGallerySection />
    </>
  );
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const { width, startResize } = useResizableWidth({
    storageKey: "wikiself.sidebarWidth",
    defaultWidth: SIDEBAR_DEFAULT_WIDTH,
    minWidth: SIDEBAR_MIN_WIDTH,
    maxWidth: SIDEBAR_MAX_WIDTH,
  });

  return (
    <>
      <aside
        className="relative hidden shrink-0 overflow-y-auto border-r border-zinc-100 bg-white px-2 py-4 md:block"
        style={{ width }}
      >
        <SidebarContent />
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Kenar çubuğu genişliğini ayarla"
          onPointerDown={startResize}
          className="absolute right-0 top-0 z-10 hidden h-full w-1 cursor-col-resize touch-none hover:bg-primary-300 md:block"
        />
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-zinc-950/40"
            onClick={onMobileClose}
            aria-label="Menüyü kapat"
            tabIndex={-1}
          />
          <aside
            id="mobile-sidebar"
            className="relative z-10 h-full w-72 max-w-[85vw] overflow-y-auto border-r border-zinc-100 bg-white px-2 py-4 shadow-xl"
            aria-label="Ana menü"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) {
                onMobileClose();
              }
            }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}

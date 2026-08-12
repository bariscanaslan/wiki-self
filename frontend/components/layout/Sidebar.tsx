import { Suspense } from "react";
import { FolderTree } from "../folder-tree/FolderTree";
import { CategoryFilterList } from "./CategoryFilterList";

type SidebarProps = {
  isMobileOpen: boolean;
  onMobileClose: () => void;
};

function SidebarContent() {
  return (
    <>
      <FolderTree />
      <Suspense fallback={null}>
        <CategoryFilterList />
      </Suspense>
    </>
  );
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-zinc-100 bg-white px-2 py-4 md:block">
        <SidebarContent />
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

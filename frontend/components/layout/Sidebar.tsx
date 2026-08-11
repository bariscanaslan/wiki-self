import { Suspense } from "react";
import { FolderTree } from "../folder-tree/FolderTree";
import { CategoryFilterList } from "./CategoryFilterList";

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-zinc-100 bg-white px-2 py-4 md:block">
      <FolderTree />
      <Suspense fallback={null}>
        <CategoryFilterList />
      </Suspense>
    </aside>
  );
}

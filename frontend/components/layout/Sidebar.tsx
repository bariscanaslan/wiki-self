import { FolderTree } from "../folder-tree/FolderTree";

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-zinc-100 bg-white px-2 py-4 md:block">
      <FolderTree />
    </aside>
  );
}

"use client";

import { FolderPlus, PackageOpen } from "lucide-react";
import { useFolderTree } from "../../lib/api/folders";
import { useAuth } from "../../lib/auth/AuthContext";
import { EmptyState } from "../ui/EmptyState";
import { Spinner } from "../ui/Spinner";
import { FolderNode } from "./FolderNode";
import { FolderTreeUIProvider, useFolderTreeUI } from "./FolderTreeUIContext";
import { CreateDocumentModal } from "./modals/CreateDocumentModal";
import { CreateFolderModal } from "./modals/CreateFolderModal";
import { DeleteFolderDialog } from "./modals/DeleteFolderDialog";
import { ExportAllModal } from "./modals/ExportAllModal";
import { MoveFolderModal } from "./modals/MoveFolderModal";
import { RenameFolderModal } from "./modals/RenameFolderModal";

function FolderTreeInner() {
  const { data: tree, isLoading } = useFolderTree();
  const { user } = useAuth();
  const { modal, openModal, closeModal } = useFolderTreeUI();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Klasörler</span>
        {user?.isAdmin && (
          <button
            type="button"
            onClick={() => openModal({ type: "createFolder", parent: null })}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-primary-600"
            aria-label="Yeni klasör"
          >
            <FolderPlus size={16} />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner className="text-primary-500" />
        </div>
      )}

      {!isLoading && (!tree || tree.length === 0) && <EmptyState title="Henüz klasör yok" description="Başlamak için bir klasör oluşturun." />}

      {tree?.map((node) => (
        <FolderNode key={node.id} node={node} depth={0} />
      ))}

      {!isLoading && tree && tree.length > 0 && (
        <button
          type="button"
          onClick={() => openModal({ type: "exportAll" })}
          className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-200 px-2 py-2 text-xs font-medium text-zinc-500 transition-colors hover:border-primary-300 hover:bg-zinc-50 hover:text-primary-700"
        >
          <PackageOpen size={14} /> Tümünü Dışa Aktar
        </button>
      )}

      <CreateFolderModal isOpen={modal?.type === "createFolder"} parent={modal?.type === "createFolder" ? modal.parent : null} onClose={closeModal} />
      <CreateDocumentModal
        isOpen={modal?.type === "createDocument"}
        parent={modal?.type === "createDocument" ? modal.parent : null}
        onClose={closeModal}
      />
      <RenameFolderModal isOpen={modal?.type === "rename"} folder={modal?.type === "rename" ? modal.folder : null} onClose={closeModal} />
      <MoveFolderModal
        isOpen={modal?.type === "move"}
        folder={modal?.type === "move" ? modal.folder : null}
        onClose={closeModal}
        tree={tree ?? []}
      />
      <DeleteFolderDialog isOpen={modal?.type === "delete"} folder={modal?.type === "delete" ? modal.folder : null} onClose={closeModal} />
      <ExportAllModal isOpen={modal?.type === "exportAll"} onClose={closeModal} />
    </div>
  );
}

export function FolderTree() {
  return (
    <FolderTreeUIProvider>
      <FolderTreeInner />
    </FolderTreeUIProvider>
  );
}

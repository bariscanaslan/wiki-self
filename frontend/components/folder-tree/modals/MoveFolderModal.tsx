"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../../lib/api/client";
import { useMoveFolder } from "../../../lib/api/folders";
import type { FolderTreeNode } from "../../../lib/types";
import { cn } from "../../../lib/utils/cn";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { FolderPickerTree } from "./FolderPickerTree";

interface MoveFolderModalProps {
  isOpen: boolean;
  folder: FolderTreeNode | null | undefined;
  tree: FolderTreeNode[];
  onClose: () => void;
}

export function MoveFolderModal({ isOpen, folder, tree, onClose }: MoveFolderModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const moveFolder = useMoveFolder();

  async function handleConfirm() {
    if (!folder) {
      return;
    }

    try {
      await moveFolder.mutateAsync({ id: folder.id, request: { newParentId: selectedId } });
      toast.success("Klasör taşındı");
      setSelectedId(null);
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`"${folder?.name ?? ""}" klasörünü taşı`}>
      <div className="max-h-80 overflow-y-auto rounded-lg border border-zinc-100 dark:border-zinc-800 p-2">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className={cn(
            "mb-1 flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
            selectedId === null ? "bg-primary-50 dark:bg-primary-500/10 font-medium text-primary-700 dark:text-primary-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
          )}
        >
          Kök dizin
        </button>
        {folder && (
          <FolderPickerTree nodes={tree} selectedId={selectedId} onSelect={setSelectedId} excludeSubtreeOf={folder.id} requireManage />
        )}
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        <Button onClick={handleConfirm} isLoading={moveFolder.isPending}>
          Taşı
        </Button>
      </div>
    </Modal>
  );
}

"use client";

import toast from "react-hot-toast";
import { extractErrorMessage } from "../../../lib/api/client";
import { useDeleteFolder } from "../../../lib/api/folders";
import type { FolderTreeNode } from "../../../lib/types";
import { ConfirmDialog } from "../../ui/ConfirmDialog";

interface DeleteFolderDialogProps {
  isOpen: boolean;
  folder: FolderTreeNode | null | undefined;
  onClose: () => void;
}

export function DeleteFolderDialog({ isOpen, folder, onClose }: DeleteFolderDialogProps) {
  const deleteFolder = useDeleteFolder();

  async function handleConfirm() {
    if (!folder) {
      return;
    }

    try {
      await deleteFolder.mutateAsync(folder.id);
      toast.success("Klasör silindi");
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Klasörü sil"
      description={`"${folder?.name ?? ""}" klasörünü silmek istediğinize emin misiniz? Klasörün boş olması gerekir.`}
      confirmLabel="Sil"
      isLoading={deleteFolder.isPending}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}

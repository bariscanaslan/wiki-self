"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../../lib/api/client";
import { useUpdateFolderIcon } from "../../../lib/api/folders";
import { FOLDER_ICONS } from "../../../lib/icons/folderIcons";
import { cn } from "../../../lib/utils/cn";
import type { FolderTreeNode } from "../../../lib/types";
import { Modal } from "../../ui/Modal";

interface FolderIconPickerProps {
  isOpen: boolean;
  folder: FolderTreeNode | null | undefined;
  onClose: () => void;
}

export function FolderIconPicker({ isOpen, folder, onClose }: FolderIconPickerProps) {
  const updateIcon = useUpdateFolderIcon();

  async function handlePick(key: string) {
    if (!folder) {
      return;
    }

    try {
      await updateIcon.mutateAsync({ id: folder.id, request: { icon: key } });
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Klasör Simgesi Seç" size="md">
      <div className="grid grid-cols-6 gap-2">
        {FOLDER_ICONS.map((option) => {
          const isSelected = (folder?.icon ?? "folder") === option.key;
          return (
            <button
              key={option.key}
              type="button"
              title={option.label}
              disabled={updateIcon.isPending}
              onClick={() => handlePick(option.key)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-zinc-500 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-50",
                isSelected ? "border-primary-400 bg-primary-50 text-primary-600" : "border-zinc-200",
              )}
            >
              <FontAwesomeIcon icon={option.icon} className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

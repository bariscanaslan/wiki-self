"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../../lib/api/client";
import { useRenameFolder } from "../../../lib/api/folders";
import type { FolderTreeNode } from "../../../lib/types";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Modal } from "../../ui/Modal";

interface RenameFolderModalProps {
  isOpen: boolean;
  folder: FolderTreeNode | null | undefined;
  onClose: () => void;
}

export function RenameFolderModal({ isOpen, folder, onClose }: RenameFolderModalProps) {
  const [prevFolder, setPrevFolder] = useState(folder);
  const [name, setName] = useState(folder?.name ?? "");
  const renameFolder = useRenameFolder();

  if (folder !== prevFolder) {
    setPrevFolder(folder);
    if (folder) {
      setName(folder.name);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!folder || !name.trim()) {
      return;
    }

    try {
      await renameFolder.mutateAsync({ id: folder.id, request: { name: name.trim() } });
      toast.success("Klasör yeniden adlandırıldı");
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Klasörü Yeniden Adlandır" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Klasör Adı" autoFocus value={name} onChange={(event) => setName(event.target.value)} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" isLoading={renameFolder.isPending}>
            Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  );
}

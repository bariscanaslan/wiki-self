"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../../lib/api/client";
import { useCreateFolder } from "../../../lib/api/folders";
import type { FolderTreeNode } from "../../../lib/types";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Modal } from "../../ui/Modal";

interface CreateFolderModalProps {
  isOpen: boolean;
  parent: FolderTreeNode | null | undefined;
  onClose: () => void;
}

export function CreateFolderModal({ isOpen, parent, onClose }: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const createFolder = useCreateFolder();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    try {
      await createFolder.mutateAsync({ name: name.trim(), parentId: parent?.id ?? null });
      toast.success("Klasör oluşturuldu");
      setName("");
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Klasör" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Klasör Adı" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ör. Ürün Dokümanları" />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" isLoading={createFolder.isPending}>
            Oluştur
          </Button>
        </div>
      </form>
    </Modal>
  );
}

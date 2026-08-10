"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../../lib/api/client";
import { useCreateDocument } from "../../../lib/api/documents";
import type { FolderTreeNode } from "../../../lib/types";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Modal } from "../../ui/Modal";

interface CreateDocumentModalProps {
  isOpen: boolean;
  parent: FolderTreeNode | null | undefined;
  onClose: () => void;
}

const EMPTY_DOCUMENT_JSON = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

export function CreateDocumentModal({ isOpen, parent, onClose }: CreateDocumentModalProps) {
  const [title, setTitle] = useState("");
  const router = useRouter();
  const createDocument = useCreateDocument();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !parent) {
      return;
    }

    try {
      const document = await createDocument.mutateAsync({
        title: title.trim(),
        folderId: parent.id,
        contentJson: EMPTY_DOCUMENT_JSON,
        contentMarkdown: "",
      });
      toast.success("Doküman oluşturuldu");
      setTitle("");
      onClose();
      router.push(`/documents/${document.id}`);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Doküman" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Doküman Başlığı"
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ör. Kurulum Rehberi"
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" isLoading={createDocument.isPending}>
            Oluştur
          </Button>
        </div>
      </form>
    </Modal>
  );
}

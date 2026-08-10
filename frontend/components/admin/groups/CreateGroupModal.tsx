"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { extractErrorMessage } from "@/lib/api/client";
import { useCreateGroup } from "@/lib/api/groups";

export function CreateGroupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createGroup = useCreateGroup();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    try {
      await createGroup.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
      toast.success("Grup oluşturuldu");
      setName("");
      setDescription("");
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Grup" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Grup Adı" autoFocus value={name} onChange={(event) => setName(event.target.value)} />
        <Textarea label="Açıklama (opsiyonel)" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" isLoading={createGroup.isPending}>
            Oluştur
          </Button>
        </div>
      </form>
    </Modal>
  );
}

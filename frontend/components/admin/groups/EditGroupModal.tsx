"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { extractErrorMessage } from "@/lib/api/client";
import { useUpdateGroup } from "@/lib/api/groups";
import type { GroupResponse } from "@/lib/types";

export function EditGroupModal({ group, onClose }: { group: GroupResponse | null; onClose: () => void }) {
  const [prevGroup, setPrevGroup] = useState(group);
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const updateGroup = useUpdateGroup();

  if (group !== prevGroup) {
    setPrevGroup(group);
    if (group) {
      setName(group.name);
      setDescription(group.description ?? "");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!group || !name.trim()) {
      return;
    }

    try {
      await updateGroup.mutateAsync({ id: group.id, request: { name: name.trim(), description: description.trim() || undefined } });
      toast.success("Grup güncellendi");
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={Boolean(group)} onClose={onClose} title="Grubu Düzenle" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Grup Adı" value={name} onChange={(event) => setName(event.target.value)} />
        <Textarea label="Açıklama (opsiyonel)" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" isLoading={updateGroup.isPending}>
            Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  );
}

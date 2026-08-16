"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { extractErrorMessage } from "@/lib/api/client";
import { useUpdateUser } from "@/lib/api/users";
import type { UserResponse } from "@/lib/types";

export function EditUserModal({ user, onClose }: { user: UserResponse | null; onClose: () => void }) {
  const [prevUser, setPrevUser] = useState(user);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [isAdmin, setIsAdmin] = useState(user?.isAdmin ?? false);
  const updateUser = useUpdateUser();

  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setDisplayName(user.displayName);
      setIsAdmin(user.isAdmin);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      return;
    }

    try {
      await updateUser.mutateAsync({ id: user.id, request: { displayName: displayName.trim(), isAdmin } });
      toast.success("Kullanıcı güncellendi");
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={Boolean(user)} onClose={onClose} title="Kullanıcıyı Düzenle" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Ad Soyad" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(event) => setIsAdmin(event.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-primary-600 dark:text-primary-400 focus:ring-primary-400"
          />
          Yönetici yetkisi
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" isLoading={updateUser.isPending}>
            Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  );
}

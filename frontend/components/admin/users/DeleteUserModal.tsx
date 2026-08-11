"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { extractErrorMessage } from "@/lib/api/client";
import { useDeleteUser } from "@/lib/api/users";
import type { UserResponse } from "@/lib/types";

export function DeleteUserModal({ user, onClose }: { user: UserResponse | null; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const deleteUser = useDeleteUser();

  function handleClose() {
    setPassword("");
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || !password) {
      return;
    }

    try {
      await deleteUser.mutateAsync({ id: user.id, request: { password } });
      toast.success("Kullanıcı silindi");
      handleClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={Boolean(user)} onClose={handleClose} title="Kullanıcıyı Sil" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600">
          <span className="font-medium text-zinc-900">{user?.displayName}</span> adlı kullanıcıyı kalıcı olarak silmek üzeresiniz. Bu
          işlem geri alınamaz. Onaylamak için kendi şifrenizi girin.
        </p>
        <Input
          type="password"
          label="Şifreniz"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Şifreniz"
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={deleteUser.isPending}>
            Vazgeç
          </Button>
          <Button type="submit" variant="danger" isLoading={deleteUser.isPending}>
            Sil
          </Button>
        </div>
      </form>
    </Modal>
  );
}

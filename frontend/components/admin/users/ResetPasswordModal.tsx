"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { extractErrorMessage } from "@/lib/api/client";
import { useResetUserPassword } from "@/lib/api/users";
import type { UserResponse } from "@/lib/types";

export function ResetPasswordModal({ user, onClose }: { user: UserResponse | null; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const resetPassword = useResetUserPassword();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || password.length < 8) {
      return;
    }

    try {
      await resetPassword.mutateAsync({ id: user.id, request: { newPassword: password } });
      toast.success("Şifre güncellendi");
      setPassword("");
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={Boolean(user)} onClose={onClose} title="Şifreyi Sıfırla" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-zinc-500">{user?.displayName} için yeni bir şifre belirleyin.</p>
        <Input
          label="Yeni Şifre"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint="En az 8 karakter"
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" isLoading={resetPassword.isPending}>
            Güncelle
          </Button>
        </div>
      </form>
    </Modal>
  );
}

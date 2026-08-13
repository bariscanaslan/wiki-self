"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { extractErrorMessage } from "@/lib/api/client";
import { useResetUserPassword } from "@/lib/api/users";
import type { UserResponse } from "@/lib/types";

export function ResetPasswordModal({ user, onClose }: { user: UserResponse | null; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const resetPassword = useResetUserPassword();

  const confirmError = confirmPassword.length > 0 && confirmPassword !== password ? "Şifreler eşleşmiyor" : undefined;

  function handleClose() {
    setPassword("");
    setConfirmPassword("");
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || password.length < 8 || password !== confirmPassword) {
      return;
    }

    try {
      await resetPassword.mutateAsync({ id: user.id, request: { newPassword: password } });
      toast.success("Şifre güncellendi");
      handleClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={Boolean(user)} onClose={handleClose} title="Şifreyi Sıfırla" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-zinc-500">{user?.displayName} için yeni bir şifre belirleyin.</p>
        <PasswordInput
          label="Yeni Şifre"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint="En az 8 karakter"
        />
        <PasswordInput
          label="Yeni Şifre (Tekrar)"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={confirmError}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Vazgeç
          </Button>
          <Button type="submit" isLoading={resetPassword.isPending} disabled={password.length < 8 || password !== confirmPassword}>
            Güncelle
          </Button>
        </div>
      </form>
    </Modal>
  );
}

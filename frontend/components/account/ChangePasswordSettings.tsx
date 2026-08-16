"use client";

import { KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useChangePassword } from "../../lib/api/auth";
import { extractErrorMessage } from "../../lib/api/client";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { PasswordInput } from "../ui/PasswordInput";

export function ChangePasswordSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const changePassword = useChangePassword();

  const confirmError = confirmPassword.length > 0 && confirmPassword !== newPassword ? "Şifreler eşleşmiyor" : undefined;
  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  function handleClose() {
    setIsOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      toast.success("Şifreniz güncellendi");
      handleClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <KeyRound size={20} className="text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Şifre</h2>
      </div>
      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">Hesabınızın şifresini değiştirin.</p>

      <Button onClick={() => setIsOpen(true)}>Şifreyi Değiştir</Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Şifreyi Değiştir" size="sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PasswordInput
            label="Mevcut Şifre"
            autoFocus
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <PasswordInput
            label="Yeni Şifre"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
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
            <Button type="submit" isLoading={changePassword.isPending} disabled={!canSubmit}>
              Güncelle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { extractErrorMessage } from "@/lib/api/client";
import { useCreateUser } from "@/lib/api/users";

const schema = z.object({
  displayName: z.string().min(1, "Ad soyad gerekli"),
  email: z.string().min(1, "E-posta gerekli").email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  isAdmin: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function CreateUserModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createUser = useCreateUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", password: "", isAdmin: false },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createUser.mutateAsync(values);
      toast.success("Kullanıcı oluşturuldu");
      reset();
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Kullanıcı" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Ad Soyad" error={errors.displayName?.message} {...register("displayName")} />
        <Input label="E-posta" type="email" error={errors.email?.message} {...register("email")} />
        <PasswordInput label="Şifre" error={errors.password?.message} {...register("password")} />
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-primary-600 dark:text-primary-400 focus:ring-primary-400" {...register("isAdmin")} />
          Yönetici yetkisi ver
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" isLoading={createUser.isPending}>
            Oluştur
          </Button>
        </div>
      </form>
    </Modal>
  );
}

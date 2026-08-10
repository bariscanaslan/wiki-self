"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "../../ui/Input";
import type { SetupFormValues } from "../SetupWizard";

export function AdminAccountStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SetupFormValues>();

  return (
    <div className="flex flex-col gap-4">
      <Input label="Ad Soyad" placeholder="Ör. Barış Can Aslan" error={errors.adminDisplayName?.message} {...register("adminDisplayName")} />
      <Input label="E-posta" type="email" placeholder="admin@sirket.com" error={errors.adminEmail?.message} {...register("adminEmail")} />
      <Input
        label="Şifre"
        type="password"
        placeholder="En az 8 karakter"
        error={errors.adminPassword?.message}
        {...register("adminPassword")}
      />
      <Input
        label="Şifre (Tekrar)"
        type="password"
        error={errors.adminPasswordConfirm?.message}
        {...register("adminPasswordConfirm")}
      />
    </div>
  );
}

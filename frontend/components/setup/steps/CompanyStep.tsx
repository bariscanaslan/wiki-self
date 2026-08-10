"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "../../ui/Input";
import { FileDropInput } from "../FileDropInput";
import type { SetupFormValues } from "../SetupWizard";

interface CompanyStepProps {
  logo: File | null;
  onLogoChange: (file: File | null) => void;
}

export function CompanyStep({ logo, onLogoChange }: CompanyStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<SetupFormValues>();

  return (
    <div className="flex flex-col gap-4">
      <Input label="Şirket Adı" placeholder="Ör. Wiki Self" error={errors.companyName?.message} {...register("companyName")} />
      <FileDropInput label="Logo (opsiyonel)" value={logo} onChange={onLogoChange} />
    </div>
  );
}

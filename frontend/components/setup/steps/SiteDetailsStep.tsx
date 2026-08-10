"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "../../ui/Input";
import { Textarea } from "../../ui/Textarea";
import { FileDropInput } from "../FileDropInput";
import type { SetupFormValues } from "../SetupWizard";

interface SiteDetailsStepProps {
  favicon: File | null;
  onFaviconChange: (file: File | null) => void;
}

export function SiteDetailsStep({ favicon, onFaviconChange }: SiteDetailsStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<SetupFormValues>();

  return (
    <div className="flex flex-col gap-4">
      <Input label="Site Başlığı" placeholder="Ör. Wiki Bilgi Merkezi" error={errors.siteTitle?.message} {...register("siteTitle")} />
      <Textarea label="Meta Açıklama (opsiyonel)" rows={3} error={errors.metaDescription?.message} {...register("metaDescription")} />
      <FileDropInput label="Favicon (opsiyonel)" value={favicon} onChange={onFaviconChange} />
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { extractErrorMessage } from "../../lib/api/client";
import { useInitializeSetup } from "../../lib/api/setup";
import { Button } from "../ui/Button";
import { Stepper } from "../ui/Stepper";
import { AdminAccountStep } from "./steps/AdminAccountStep";
import { CompanyStep } from "./steps/CompanyStep";
import { SiteDetailsStep } from "./steps/SiteDetailsStep";

const stepLabels = ["Yönetici Hesabı", "Şirket Bilgileri", "Site Ayarları"];

const stepFieldNames = [
  ["adminEmail", "adminPassword", "adminPasswordConfirm", "adminDisplayName"],
  ["companyName"],
  ["siteTitle", "metaDescription"],
] as const;

const setupSchema = z
  .object({
    adminEmail: z.string().min(1, "E-posta gerekli").email("Geçerli bir e-posta girin"),
    adminPassword: z.string().min(8, "Şifre en az 8 karakter olmalı"),
    adminPasswordConfirm: z.string().min(1, "Şifre tekrarı gerekli"),
    adminDisplayName: z.string().min(1, "Ad soyad gerekli"),
    companyName: z.string().min(1, "Şirket adı gerekli"),
    siteTitle: z.string().min(1, "Site başlığı gerekli"),
    metaDescription: z.string().optional(),
  })
  .refine((data) => data.adminPassword === data.adminPasswordConfirm, {
    message: "Şifreler eşleşmiyor",
    path: ["adminPasswordConfirm"],
  });

export type SetupFormValues = z.infer<typeof setupSchema>;

export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [logo, setLogo] = useState<File | null>(null);
  const [favicon, setFavicon] = useState<File | null>(null);
  const initializeSetup = useInitializeSetup();

  const methods = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      adminEmail: "",
      adminPassword: "",
      adminPasswordConfirm: "",
      adminDisplayName: "",
      companyName: "",
      siteTitle: "",
      metaDescription: "",
    },
    mode: "onBlur",
  });

  const isLastStep = step === stepLabels.length - 1;

  async function handleNext() {
    const fields = [...stepFieldNames[step]] as (keyof SetupFormValues)[];
    const isValid = await methods.trigger(fields);
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, stepLabels.length - 1));
    }
  }

  function handleBack() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function onSubmit(values: SetupFormValues) {
    try {
      await initializeSetup.mutateAsync({
        adminEmail: values.adminEmail,
        adminPassword: values.adminPassword,
        adminDisplayName: values.adminDisplayName,
        companyName: values.companyName,
        siteTitle: values.siteTitle,
        metaDescription: values.metaDescription,
        logo,
        favicon,
      });
      toast.success("Kurulum tamamlandı, giriş yapabilirsiniz.");
      router.replace("/login");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl rounded-2xl border border-zinc-100 bg-white p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">WikiSelf Kurulumu</h1>
          <p className="mt-1 text-sm text-zinc-500">Başlamadan önce birkaç adımı tamamlayalım.</p>
        </div>

        <div className="mb-8">
          <Stepper steps={stepLabels} currentStep={step} />
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                {step === 0 && <AdminAccountStep />}
                {step === 1 && <CompanyStep logo={logo} onLogoChange={setLogo} />}
                {step === 2 && <SiteDetailsStep favicon={favicon} onFaviconChange={setFavicon} />}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-between">
              <Button type="button" variant="ghost" onClick={handleBack} disabled={step === 0}>
                Geri
              </Button>
              {isLastStep ? (
                <Button type="submit" isLoading={initializeSetup.isPending}>
                  Kurulumu Tamamla
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  İleri
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </motion.div>
    </div>
  );
}

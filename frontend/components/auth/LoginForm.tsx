"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { extractErrorMessage, resolveAssetUrl } from "../../lib/api/client";
import { useAuth } from "../../lib/auth/AuthContext";
import { useSiteSettings } from "../../lib/settings/SettingsContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const loginSchema = z.object({
  email: z.string().min(1, "E-posta gerekli").email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const { settings } = useSiteSettings();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const logoUrl = resolveAssetUrl(settings?.logoUrl);

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values);
      router.replace("/");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm rounded-2xl border border-zinc-100 bg-white p-8 shadow-xl"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          {logoUrl ? (
            <img src={logoUrl} alt={settings?.companyName ?? "Logo"} className="mb-4 h-14 w-14 rounded-xl object-cover" />
          ) : (
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-600 text-xl font-bold text-white">
              {(settings?.companyName ?? "W").charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-xl font-bold text-zinc-900">{settings?.companyName || "WikiSelf"}</h1>
          <p className="mt-1 text-sm text-zinc-500">Devam etmek için giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="E-posta" type="email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
          <Input label="Şifre" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Giriş Yap
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

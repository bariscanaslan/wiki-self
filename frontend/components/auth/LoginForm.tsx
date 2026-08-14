"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from "@marsidev/react-turnstile";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { usePublicConfig } from "../../lib/api/config";
import { extractErrorMessage, resolveAssetUrl } from "../../lib/api/client";
import { useAuth } from "../../lib/auth/AuthContext";
import { useSiteSettings } from "../../lib/settings/SettingsContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { PasswordInput } from "../ui/PasswordInput";

const loginSchema = z.object({
  email: z.string().min(1, "E-posta gerekli").email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login, completeTwoFactorLogin } = useAuth();
  const { settings } = useSiteSettings();
  const { data: publicConfig } = usePublicConfig();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const logoUrl = resolveAssetUrl(settings?.logoUrl);
  const turnstileEnabled = publicConfig?.turnstileEnabled ?? false;

  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await login({ ...values, turnstileToken: turnstileToken ?? undefined });
      if (result.requiresTwoFactor && result.challengeToken) {
        setChallengeToken(result.challengeToken);
        return;
      }
      router.replace("/");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    if (!challengeToken || !code.trim()) {
      return;
    }

    setIsVerifying(true);
    try {
      await completeTwoFactorLogin(challengeToken, code.trim());
      router.replace("/");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsVerifying(false);
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
          <p className="mt-1 text-sm text-zinc-500">
            {challengeToken ? "Authenticator uygulamanızdaki kodu girin" : "Devam etmek için giriş yapın"}
          </p>
        </div>

        {challengeToken ? (
          <form key="verify" onSubmit={handleVerify} className="flex flex-col gap-4">
            <Input
              label="Doğrulama Kodu"
              placeholder="123456 veya kurtarma kodu"
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <Button type="submit" isLoading={isVerifying} className="mt-2 w-full">
              Doğrula
            </Button>
            <button
              type="button"
              onClick={() => {
                setChallengeToken(null);
                setCode("");
              }}
              className="text-center text-xs font-medium text-zinc-500 hover:text-primary-600"
            >
              Farklı bir hesapla giriş yap
            </button>
          </form>
        ) : (
          <form key="credentials" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="E-posta" type="email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
            <PasswordInput label="Şifre" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
            {turnstileEnabled && publicConfig ? (
              <Turnstile
                siteKey={publicConfig.turnstileSiteKey}
                onSuccess={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
                className="mx-auto"
              />
            ) : null}
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={turnstileEnabled && !turnstileToken}
              className="mt-2 w-full"
            >
              Giriş Yap
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

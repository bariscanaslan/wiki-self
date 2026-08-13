"use client";

import { Check, Copy, ShieldCheck, ShieldOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useDisableTwoFactor, useEnableTwoFactor, useSetupTwoFactor } from "../../lib/api/auth";
import { extractErrorMessage } from "../../lib/api/client";
import { useAuth } from "../../lib/auth/AuthContext";
import type { TwoFactorSetupResponse } from "../../lib/types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { PasswordInput } from "../ui/PasswordInput";

type Step = "idle" | "setup" | "recoveryCodes";

export function TwoFactorSettings() {
  const { user, refetchMe } = useAuth();
  const [step, setStep] = useState<Step>("idle");
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  const setupTwoFactor = useSetupTwoFactor();
  const enableTwoFactor = useEnableTwoFactor();
  const disableTwoFactor = useDisableTwoFactor();

  async function handleStartSetup() {
    try {
      const data = await setupTwoFactor.mutateAsync();
      setSetupData(data);
      setCode("");
      setStep("setup");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function handleConfirmSetup(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) {
      return;
    }

    try {
      const result = await enableTwoFactor.mutateAsync({ code: code.trim() });
      setRecoveryCodes(result.recoveryCodes);
      setStep("recoveryCodes");
      await refetchMe();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  function handleFinish() {
    setStep("idle");
    setSetupData(null);
    setRecoveryCodes([]);
  }

  function handleCancelSetup() {
    setStep("idle");
    setSetupData(null);
    setCode("");
  }

  async function handleDisable(event: FormEvent) {
    event.preventDefault();
    if (!disablePassword) {
      return;
    }

    try {
      await disableTwoFactor.mutateAsync({ password: disablePassword });
      toast.success("İki faktörlü doğrulama devre dışı bırakıldı");
      setIsDisableOpen(false);
      setDisablePassword("");
      await refetchMe();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  function handleCopyRecoveryCodes() {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    toast.success("Kurtarma kodları kopyalandı");
  }

  const isEnabled = user?.twoFactorEnabled ?? false;

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        {isEnabled ? <ShieldCheck size={20} className="text-primary-600" /> : <ShieldOff size={20} className="text-zinc-400" />}
        <h2 className="text-lg font-semibold text-zinc-900">İki Faktörlü Doğrulama</h2>
      </div>
      <p className="mb-5 text-sm text-zinc-500">
        Etkinleştirildiğinde, şifrenizin yanı sıra bir authenticator uygulamasından (Google Authenticator, Authy vb.) alınan
        kodu da girmeniz gerekir.
      </p>

      {step === "idle" &&
        (isEnabled ? (
          <Button variant="danger" onClick={() => setIsDisableOpen(true)}>
            Devre Dışı Bırak
          </Button>
        ) : (
          <Button onClick={handleStartSetup} isLoading={setupTwoFactor.isPending}>
            Etkinleştir
          </Button>
        ))}

      {step === "setup" && setupData && (
        <form onSubmit={handleConfirmSetup} className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <img
              src={`data:image/png;base64,${setupData.qrCodeImageBase64}`}
              alt="İki faktörlü doğrulama QR kodu"
              className="h-40 w-40"
            />
            <p className="text-center text-xs text-zinc-500">QR kodu authenticator uygulamanızla tarayın, ya da bu kodu elle girin:</p>
            <code className="select-all rounded bg-white px-2 py-1 font-mono text-xs text-zinc-700">{setupData.secret}</code>
          </div>

          <Input label="Doğrulama Kodu" placeholder="123456" autoFocus value={code} onChange={(event) => setCode(event.target.value)} />

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={handleCancelSetup}>
              Vazgeç
            </Button>
            <Button type="submit" isLoading={enableTwoFactor.isPending}>
              Onayla ve Etkinleştir
            </Button>
          </div>
        </form>
      )}

      {step === "recoveryCodes" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600">
            Bu kurtarma kodlarını güvenli bir yerde saklayın. Authenticator uygulamanıza erişemediğinizde her biri bir kez
            kullanılabilir. Bu kodlar tekrar gösterilmeyecek.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 font-mono text-sm text-zinc-700">
            {recoveryCodes.map((recoveryCode) => (
              <span key={recoveryCode}>{recoveryCode}</span>
            ))}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleCopyRecoveryCodes}>
              <Copy size={14} /> Kopyala
            </Button>
            <Button type="button" onClick={handleFinish}>
              <Check size={14} /> Tamamlandı
            </Button>
          </div>
        </div>
      )}

      <Modal isOpen={isDisableOpen} onClose={() => setIsDisableOpen(false)} title="İki Faktörlü Doğrulamayı Devre Dışı Bırak" size="sm">
        <form onSubmit={handleDisable} className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600">Devam etmek için şifrenizi girin.</p>
          <PasswordInput label="Şifre" autoFocus value={disablePassword} onChange={(event) => setDisablePassword(event.target.value)} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsDisableOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" variant="danger" isLoading={disableTwoFactor.isPending}>
              Devre Dışı Bırak
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

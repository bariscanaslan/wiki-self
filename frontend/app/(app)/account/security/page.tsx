import { ChangePasswordSettings } from "@/components/account/ChangePasswordSettings";
import { TwoFactorSettings } from "@/components/account/TwoFactorSettings";

export default function AccountSecurityPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Hesap Güvenliği</h1>
      <div className="flex flex-col gap-6">
        <ChangePasswordSettings />
        <TwoFactorSettings />
      </div>
    </div>
  );
}

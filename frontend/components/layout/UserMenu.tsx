"use client";

import { KeyRound, LogOut, ScrollText, Settings, Shield, Users as UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "../ui/Avatar";
import { DropdownItem, DropdownMenu } from "../ui/DropdownMenu";
import { useAuth } from "../../lib/auth/AuthContext";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <DropdownMenu
      trigger={
        <button type="button" className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80">
          <Avatar name={user.displayName} />
        </button>
      }
    >
      <div className="border-b border-zinc-100 px-3 py-2">
        <p className="truncate text-sm font-semibold text-zinc-900">{user.displayName}</p>
        <p className="truncate text-xs text-zinc-500">{user.email}</p>
      </div>
      <div className="py-1">
        <DropdownItem href="/account/security">
          <KeyRound size={16} /> Hesap Güvenliği
        </DropdownItem>
        {user.isAdmin && (
          <>
            <DropdownItem href="/admin/users">
              <UsersIcon size={16} /> Kullanıcılar ve Gruplar
            </DropdownItem>
            <DropdownItem href="/admin/permissions">
              <Shield size={16} /> İzinler
            </DropdownItem>
            <DropdownItem href="/admin/settings">
              <Settings size={16} /> Site Ayarları
            </DropdownItem>
            <DropdownItem href="/admin/audit">
              <ScrollText size={16} /> Denetim Kaydı
            </DropdownItem>
          </>
        )}
      </div>
      <div className="border-t border-zinc-100 pt-1">
        <DropdownItem danger onClick={handleLogout}>
          <LogOut size={16} /> Çıkış Yap
        </DropdownItem>
      </div>
    </DropdownMenu>
  );
}

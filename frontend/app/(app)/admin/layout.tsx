"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/admin/users", label: "Kullanıcılar" },
  { href: "/admin/groups", label: "Gruplar" },
  { href: "/admin/permissions", label: "İzinler" },
  { href: "/admin/settings", label: "Site Ayarları" },
  { href: "/admin/audit", label: "Denetim Kaydı" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user?.isAdmin) {
    return <FullPageSpinner />;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Yönetim</h1>
      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-zinc-100 dark:border-zinc-800">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith(item.href) ? "border-primary-600 dark:border-primary-500 text-primary-700 dark:text-primary-400" : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}

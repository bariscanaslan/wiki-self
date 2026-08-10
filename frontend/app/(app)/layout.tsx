"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { useSetupStatus } from "../../lib/api/setup";
import { useAuth } from "../../lib/auth/AuthContext";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { data: setupStatus, isLoading: setupLoading } = useSetupStatus();

  useEffect(() => {
    if (setupLoading || isLoading) {
      return;
    }
    if (setupStatus && !setupStatus.isInitialized) {
      router.replace("/setup");
      return;
    }
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [setupLoading, isLoading, setupStatus, isAuthenticated, router]);

  const isReady = !setupLoading && !isLoading && isAuthenticated && (setupStatus?.isInitialized ?? false);

  if (!isReady) {
    return <FullPageSpinner />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-zinc-50/50">{children}</main>
      </div>
    </div>
  );
}

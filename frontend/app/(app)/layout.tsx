"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { useSetupStatus } from "../../lib/api/setup";
import { useAuth } from "../../lib/auth/AuthContext";
import { useLocalStorageFlag } from "../../lib/hooks/useLocalStorageFlag";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { data: setupStatus, isLoading: setupLoading } = useSetupStatus();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorageFlag("wikiself.sidebarCollapsed", false);

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false);
      }
    };
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      desktopQuery.removeEventListener("change", closeOnDesktop);
    };
  }, [isMobileSidebarOpen]);

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
      <Header
        isMobileSidebarOpen={isMobileSidebarOpen}
        onMobileSidebarToggle={() => setIsMobileSidebarOpen((isOpen) => !isOpen)}
        isSidebarCollapsed={isSidebarCollapsed}
        onSidebarCollapsedToggle={() => setIsSidebarCollapsed((isCollapsed) => !isCollapsed)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
        <main inert={isMobileSidebarOpen} className="flex-1 overflow-y-auto bg-zinc-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}

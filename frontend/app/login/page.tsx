"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginForm } from "../../components/auth/LoginForm";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { useSetupStatus } from "../../lib/api/setup";
import { useAuth } from "../../lib/auth/AuthContext";

export default function LoginPage() {
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
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [setupLoading, isLoading, setupStatus, isAuthenticated, router]);

  const shouldBlock = setupLoading || isLoading || isAuthenticated || (setupStatus ? !setupStatus.isInitialized : false);

  if (shouldBlock) {
    return <FullPageSpinner />;
  }

  return <LoginForm />;
}

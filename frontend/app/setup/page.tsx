"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SetupWizard } from "../../components/setup/SetupWizard";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { useSetupStatus } from "../../lib/api/setup";

export default function SetupPage() {
  const router = useRouter();
  const { data, isLoading } = useSetupStatus();

  useEffect(() => {
    if (!isLoading && data?.isInitialized) {
      router.replace("/login");
    }
  }, [isLoading, data, router]);

  if (isLoading || data?.isInitialized) {
    return <FullPageSpinner />;
  }

  return <SetupWizard />;
}

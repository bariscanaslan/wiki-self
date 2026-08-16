"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../../lib/auth/AuthContext";
import { SettingsProvider } from "../../lib/settings/SettingsContext";
import { ThemeProvider } from "../../lib/theme/ThemeContext";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3200,
                style: {
                  background: "#18181b",
                  color: "#fafafa",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  padding: "0.75rem 1rem",
                },
                success: {
                  iconTheme: { primary: "#dc2626", secondary: "#fafafa" },
                },
              }}
            />
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

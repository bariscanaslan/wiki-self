"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  fetchMe,
  login as loginApi,
  logout as logoutApi,
  refresh as refreshApi,
  verifyTwoFactorLogin as verifyTwoFactorLoginApi,
} from "../api/auth";
import { clearTokens, getRefreshToken, loadPersistedRefreshToken, setTokens } from "./token-store";
import type { LoginRequest, LoginResult, UserResponse } from "../types";

interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<LoginResult>;
  completeTwoFactorLogin: (challengeToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const persistedRefreshToken = loadPersistedRefreshToken();
      if (!persistedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const tokens = await refreshApi({ refreshToken: persistedRefreshToken });
        setTokens(tokens.accessToken, tokens.refreshToken);
        const me = await fetchMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        clearTokens();
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    const result = await loginApi(request);
    if (!result.requiresTwoFactor && result.tokens) {
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      setUser(result.tokens.user);
    }
    return result;
  }, []);

  const completeTwoFactorLogin = useCallback(async (challengeToken: string, code: string) => {
    const response = await verifyTwoFactorLoginApi({ challengeToken, code });
    setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    const token = getRefreshToken();
    if (token) {
      try {
        await logoutApi(token);
      } catch {
        clearTokens();
      }
    }
    clearTokens();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const refetchMe = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: Boolean(user), login, completeTwoFactorLogin, logout, refetchMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

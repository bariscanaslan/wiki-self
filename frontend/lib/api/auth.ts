import { useMutation } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  LoginResult,
  RefreshTokenResponse,
  TwoFactorDisableRequest,
  TwoFactorEnableRequest,
  TwoFactorEnableResponse,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
  VerifyPasswordRequest,
} from "../types";
import type { UserResponse } from "../types";

export async function login(request: LoginRequest): Promise<LoginResult> {
  const response = await apiClient.post<LoginResult>("/auth/login", request);
  return response.data;
}

export async function verifyTwoFactorLogin(request: TwoFactorVerifyRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/2fa/verify", request);
  return response.data;
}

export async function setupTwoFactor(): Promise<TwoFactorSetupResponse> {
  const response = await apiClient.post<TwoFactorSetupResponse>("/auth/2fa/setup");
  return response.data;
}

export async function enableTwoFactor(request: TwoFactorEnableRequest): Promise<TwoFactorEnableResponse> {
  const response = await apiClient.post<TwoFactorEnableResponse>("/auth/2fa/enable", request);
  return response.data;
}

export async function disableTwoFactor(request: TwoFactorDisableRequest): Promise<void> {
  await apiClient.post("/auth/2fa/disable", request);
}

export async function refresh(): Promise<RefreshTokenResponse> {
  const response = await apiClient.post<RefreshTokenResponse>("/auth/refresh");
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function fetchMe(): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>("/auth/me");
  return response.data;
}

export async function verifyPassword(request: VerifyPasswordRequest): Promise<void> {
  await apiClient.post("/auth/verify-password", request);
}

export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  await apiClient.post("/auth/change-password", request);
}

export function useSetupTwoFactor() {
  return useMutation({ mutationFn: setupTwoFactor });
}

export function useEnableTwoFactor() {
  return useMutation({ mutationFn: enableTwoFactor });
}

export function useDisableTwoFactor() {
  return useMutation({ mutationFn: disableTwoFactor });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}

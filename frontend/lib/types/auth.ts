import type { UserResponse } from "./users";

export interface LoginRequest {
  email: string;
  password: string;
  turnstileToken?: string;
}

export interface LoginResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: UserResponse;
}

export interface LoginResult {
  requiresTwoFactor: boolean;
  challengeToken: string | null;
  tokens: LoginResponse | null;
}

export interface TwoFactorVerifyRequest {
  challengeToken: string;
  code: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpAuthUri: string;
  qrCodeImageBase64: string;
}

export interface TwoFactorEnableRequest {
  code: string;
}

export interface TwoFactorEnableResponse {
  recoveryCodes: string[];
}

export interface TwoFactorDisableRequest {
  password: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
}

export interface VerifyPasswordRequest {
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

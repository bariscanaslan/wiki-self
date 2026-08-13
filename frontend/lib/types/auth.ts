import type { UserResponse } from "./users";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
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

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface VerifyPasswordRequest {
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

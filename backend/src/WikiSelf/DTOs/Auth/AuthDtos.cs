using WikiSelf.DTOs.Users;

namespace WikiSelf.DTOs.Auth;

public record LoginRequest(string Email, string Password, string? TurnstileToken = null);

public record LoginResponse(string AccessToken, string RefreshToken, DateTime AccessTokenExpiresAt, UserResponse User);

public record LoginResult(bool RequiresTwoFactor, string? ChallengeToken, LoginResponse? Tokens);

public record RefreshTokenRequest(string RefreshToken);

public record RefreshTokenResponse(string AccessToken, string RefreshToken, DateTime AccessTokenExpiresAt);

public record LogoutRequest(string RefreshToken);

public record VerifyPasswordRequest(string Password);

public record TwoFactorVerifyRequest(string ChallengeToken, string Code);

public record TwoFactorSetupResponse(string Secret, string OtpAuthUri, string QrCodeImageBase64);

public record TwoFactorEnableRequest(string Code);

public record TwoFactorEnableResponse(IReadOnlyList<string> RecoveryCodes);

public record TwoFactorDisableRequest(string Password);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

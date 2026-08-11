using WikiSelf.DTOs.Users;

namespace WikiSelf.DTOs.Auth;

public record LoginRequest(string Email, string Password);

public record LoginResponse(string AccessToken, string RefreshToken, DateTime AccessTokenExpiresAt, UserResponse User);

public record RefreshTokenRequest(string RefreshToken);

public record RefreshTokenResponse(string AccessToken, string RefreshToken, DateTime AccessTokenExpiresAt);

public record LogoutRequest(string RefreshToken);

public record VerifyPasswordRequest(string Password);

using WikiSelf.DTOs.Users;

namespace WikiSelf.Services.Auth;

public record TokenPair(string AccessToken, DateTime AccessTokenExpiresAt, string RefreshToken, DateTime RefreshTokenExpiresAt);

public record TokenIssuance(TokenPair Tokens, UserResponse User);

public record LoginOutcome(bool RequiresTwoFactor, string? ChallengeToken, TokenIssuance? Tokens);

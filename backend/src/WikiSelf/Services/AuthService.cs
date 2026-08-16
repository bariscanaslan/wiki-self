using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OtpNet;
using QRCoder;
using WikiSelf.Data;
using WikiSelf.DTOs.Auth;
using WikiSelf.DTOs.Groups;
using WikiSelf.DTOs.Users;
using WikiSelf.Entities;
using WikiSelf.Services.Auth;
using WikiSelf.Services.Exceptions;

namespace WikiSelf.Services;

public class AuthService : IAuthService
{
    private const int MfaChallengeExpiryMinutes = 5;
    private const int MaxMfaAttempts = 5;
    private const int RecoveryCodeCount = 10;
    private const string TwoFactorIssuer = "WikiSelf";

    private readonly AppDbContext _db;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ITurnstileService _turnstileService;
    private readonly JwtSettings _jwtSettings;

    public AuthService(AppDbContext db, IJwtTokenService jwtTokenService, ITurnstileService turnstileService, IOptions<JwtSettings> jwtSettings)
    {
        _db = db;
        _jwtTokenService = jwtTokenService;
        _turnstileService = turnstileService;
        _jwtSettings = jwtSettings.Value;
    }

    private static UserResponse ToUserResponse(User user)
    {
        return new UserResponse(
            user.Id,
            user.Email,
            user.DisplayName,
            user.IsAdmin,
            user.IsActive,
            user.CreatedAt,
            user.UserGroups.Select(ug => new GroupSummaryResponse(ug.Group.Id, ug.Group.Name)).ToList(),
            user.TwoFactorEnabled);
    }

    private async Task<TokenIssuance> IssueTokensAsync(User user)
    {
        var (accessToken, expiresAt) = _jwtTokenService.GenerateAccessToken(user);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        var refreshExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);

        _db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _jwtTokenService.HashRefreshToken(refreshToken),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = refreshExpiresAt
        });

        await _db.SaveChangesAsync();

        return new TokenIssuance(new TokenPair(accessToken, expiresAt, refreshToken, refreshExpiresAt), ToUserResponse(user));
    }

    public async Task<LoginOutcome> LoginAsync(LoginRequest request)
    {
        if (!await _turnstileService.VerifyAsync(request.TurnstileToken))
        {
            throw new UnauthorizedAppException("Turnstile verification failed.");
        }

        var user = await _db.Users
            .Include(u => u.UserGroups).ThenInclude(ug => ug.Group)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAppException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new ForbiddenException("This account has been deactivated.");
        }

        if (user.TwoFactorEnabled)
        {
            var challenge = new MfaChallenge
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(MfaChallengeExpiryMinutes)
            };

            _db.MfaChallenges.Add(challenge);
            await _db.SaveChangesAsync();

            return new LoginOutcome(true, challenge.Id.ToString(), null);
        }

        var tokens = await IssueTokensAsync(user);
        return new LoginOutcome(false, null, tokens);
    }

    public async Task<TokenIssuance> VerifyTwoFactorLoginAsync(TwoFactorVerifyRequest request)
    {
        if (!Guid.TryParse(request.ChallengeToken, out var challengeId))
        {
            throw new UnauthorizedAppException("Invalid or expired verification session.");
        }

        var challenge = await _db.MfaChallenges
            .Include(c => c.User).ThenInclude(u => u.UserGroups).ThenInclude(ug => ug.Group)
            .FirstOrDefaultAsync(c => c.Id == challengeId);

        if (challenge is null || challenge.IsExpired)
        {
            throw new UnauthorizedAppException("Invalid or expired verification session.");
        }

        if (challenge.FailedAttempts >= MaxMfaAttempts)
        {
            _db.MfaChallenges.Remove(challenge);
            await _db.SaveChangesAsync();
            throw new UnauthorizedAppException("Too many failed attempts. Please log in again.");
        }

        if (!VerifyTotpOrRecoveryCode(challenge.User, request.Code))
        {
            challenge.FailedAttempts++;
            await _db.SaveChangesAsync();
            throw new UnauthorizedAppException("Invalid verification code.");
        }

        _db.MfaChallenges.Remove(challenge);
        return await IssueTokensAsync(challenge.User);
    }

    public async Task<TwoFactorSetupResponse> SetupTwoFactorAsync(Guid userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
                   ?? throw new NotFoundException("User not found.");

        if (user.TwoFactorEnabled)
        {
            throw new BadRequestException("Two-factor authentication is already enabled. Disable it before re-enrolling.");
        }

        var secretBytes = KeyGeneration.GenerateRandomKey(20);
        var secret = Base32Encoding.ToString(secretBytes);

        user.TwoFactorSecret = secret;
        await _db.SaveChangesAsync();

        var otpAuthUri = BuildOtpAuthUri(user.Email, secret);
        var qrCodeImageBase64 = BuildQrCodeBase64(otpAuthUri);

        return new TwoFactorSetupResponse(secret, otpAuthUri, qrCodeImageBase64);
    }

    public async Task<TwoFactorEnableResponse> EnableTwoFactorAsync(Guid userId, TwoFactorEnableRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
                   ?? throw new NotFoundException("User not found.");

        if (string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            throw new BadRequestException("Two-factor setup has not been started.");
        }

        var totp = new Totp(Base32Encoding.ToBytes(user.TwoFactorSecret));
        if (!totp.VerifyTotp(request.Code.Trim(), out _, new VerificationWindow(1, 1)))
        {
            throw new UnauthorizedAppException("Invalid verification code.");
        }

        var (plainCodes, hashJson) = GenerateRecoveryCodes();
        user.TwoFactorEnabled = true;
        user.TwoFactorRecoveryCodesHash = hashJson;
        await _db.SaveChangesAsync();

        return new TwoFactorEnableResponse(plainCodes);
    }

    public async Task DisableTwoFactorAsync(Guid userId, TwoFactorDisableRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
                   ?? throw new NotFoundException("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAppException("Invalid password.");
        }

        user.TwoFactorEnabled = false;
        user.TwoFactorSecret = null;
        user.TwoFactorRecoveryCodesHash = null;
        await _db.SaveChangesAsync();
    }

    private static string BuildOtpAuthUri(string email, string secret)
    {
        var issuer = Uri.EscapeDataString(TwoFactorIssuer);
        var label = Uri.EscapeDataString(email);
        return $"otpauth://totp/{issuer}:{label}?secret={secret}&issuer={issuer}&digits=6&period=30";
    }

    private static string BuildQrCodeBase64(string otpAuthUri)
    {
        var qrGenerator = new QRCodeGenerator();
        var qrCodeData = qrGenerator.CreateQrCode(otpAuthUri, QRCodeGenerator.ECCLevel.Q);
        var pngQrCode = new PngByteQRCode(qrCodeData);
        return Convert.ToBase64String(pngQrCode.GetGraphic(10));
    }

    private static bool VerifyTotpOrRecoveryCode(User user, string code)
    {
        if (string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            return false;
        }

        var totp = new Totp(Base32Encoding.ToBytes(user.TwoFactorSecret));
        if (totp.VerifyTotp(code.Trim(), out _, new VerificationWindow(1, 1)))
        {
            return true;
        }

        return TryConsumeRecoveryCode(user, code);
    }

    private static bool TryConsumeRecoveryCode(User user, string code)
    {
        if (string.IsNullOrWhiteSpace(user.TwoFactorRecoveryCodesHash))
        {
            return false;
        }

        var hashes = JsonSerializer.Deserialize<List<string>>(user.TwoFactorRecoveryCodesHash) ?? [];
        var normalized = code.Trim().Replace("-", "").ToUpperInvariant();

        var matchIndex = hashes.FindIndex(h => BCrypt.Net.BCrypt.Verify(normalized, h));
        if (matchIndex < 0)
        {
            return false;
        }

        hashes.RemoveAt(matchIndex);
        user.TwoFactorRecoveryCodesHash = JsonSerializer.Serialize(hashes);
        return true;
    }

    private static (List<string> PlainCodes, string HashJson) GenerateRecoveryCodes()
    {
        var plainCodes = new List<string>();
        var hashes = new List<string>();

        for (var i = 0; i < RecoveryCodeCount; i++)
        {
            var code = Convert.ToHexString(RandomNumberGenerator.GetBytes(5));
            plainCodes.Add($"{code[..5]}-{code[5..]}");
            hashes.Add(BCrypt.Net.BCrypt.HashPassword(code));
        }

        return (plainCodes, JsonSerializer.Serialize(hashes));
    }

    public async Task<TokenPair> RefreshAsync(string refreshToken)
    {
        var tokenHash = _jwtTokenService.HashRefreshToken(refreshToken);

        var existingToken = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (existingToken is null || !existingToken.IsActive)
        {
            throw new UnauthorizedAppException("Invalid or expired refresh token.");
        }

        if (!existingToken.User.IsActive)
        {
            throw new ForbiddenException("This account has been deactivated.");
        }

        var (accessToken, expiresAt) = _jwtTokenService.GenerateAccessToken(existingToken.User);
        var newRefreshToken = _jwtTokenService.GenerateRefreshToken();
        var newRefreshExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);

        var newTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = existingToken.UserId,
            TokenHash = _jwtTokenService.HashRefreshToken(newRefreshToken),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = newRefreshExpiresAt
        };

        existingToken.RevokedAt = DateTime.UtcNow;
        existingToken.ReplacedByTokenId = newTokenEntity.Id;

        _db.RefreshTokens.Add(newTokenEntity);
        await _db.SaveChangesAsync();

        return new TokenPair(accessToken, expiresAt, newRefreshToken, newRefreshExpiresAt);
    }

    public async Task LogoutAsync(string? refreshToken)
    {
        if (string.IsNullOrEmpty(refreshToken))
        {
            return;
        }

        var tokenHash = _jwtTokenService.HashRefreshToken(refreshToken);

        var existingToken = await _db.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);
        if (existingToken is null || existingToken.RevokedAt.HasValue)
        {
            return;
        }

        existingToken.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<UserResponse> GetMeAsync(Guid userId)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Include(u => u.UserGroups).ThenInclude(ug => ug.Group)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("User not found.");

        return ToUserResponse(user);
    }

    public async Task VerifyPasswordAsync(Guid userId, VerifyPasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAppException("Invalid password.");
        }
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new UnauthorizedAppException("Current password is incorrect.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();
    }
}

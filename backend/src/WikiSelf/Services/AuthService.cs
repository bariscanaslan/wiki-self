using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
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
    private readonly AppDbContext _db;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly JwtSettings _jwtSettings;

    public AuthService(AppDbContext db, IJwtTokenService jwtTokenService, IOptions<JwtSettings> jwtSettings)
    {
        _db = db;
        _jwtTokenService = jwtTokenService;
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
            user.UserGroups.Select(ug => new GroupSummaryResponse(ug.Group.Id, ug.Group.Name)).ToList());
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
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

        var (accessToken, expiresAt) = _jwtTokenService.GenerateAccessToken(user);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        _db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _jwtTokenService.HashRefreshToken(refreshToken),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays)
        });

        await _db.SaveChangesAsync();

        return new LoginResponse(accessToken, refreshToken, expiresAt, ToUserResponse(user));
    }

    public async Task<RefreshTokenResponse> RefreshAsync(RefreshTokenRequest request)
    {
        var tokenHash = _jwtTokenService.HashRefreshToken(request.RefreshToken);

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

        var newTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = existingToken.UserId,
            TokenHash = _jwtTokenService.HashRefreshToken(newRefreshToken),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays)
        };

        existingToken.RevokedAt = DateTime.UtcNow;
        existingToken.ReplacedByTokenId = newTokenEntity.Id;

        _db.RefreshTokens.Add(newTokenEntity);
        await _db.SaveChangesAsync();

        return new RefreshTokenResponse(accessToken, newRefreshToken, expiresAt);
    }

    public async Task LogoutAsync(LogoutRequest request)
    {
        var tokenHash = _jwtTokenService.HashRefreshToken(request.RefreshToken);

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
}

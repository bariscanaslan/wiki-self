using WikiSelf.DTOs.Auth;
using WikiSelf.DTOs.Users;
using WikiSelf.Services.Auth;

namespace WikiSelf.Services;

public interface IAuthService
{
    Task<LoginOutcome> LoginAsync(LoginRequest request);
    Task<TokenIssuance> VerifyTwoFactorLoginAsync(TwoFactorVerifyRequest request);
    Task<TokenPair> RefreshAsync(string refreshToken);
    Task LogoutAsync(string? refreshToken);
    Task<UserResponse> GetMeAsync(Guid userId);
    Task VerifyPasswordAsync(Guid userId, VerifyPasswordRequest request);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task<TwoFactorSetupResponse> SetupTwoFactorAsync(Guid userId);
    Task<TwoFactorEnableResponse> EnableTwoFactorAsync(Guid userId, TwoFactorEnableRequest request);
    Task DisableTwoFactorAsync(Guid userId, TwoFactorDisableRequest request);
}

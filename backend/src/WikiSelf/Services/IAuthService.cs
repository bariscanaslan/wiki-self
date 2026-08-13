using WikiSelf.DTOs.Auth;
using WikiSelf.DTOs.Users;

namespace WikiSelf.Services;

public interface IAuthService
{
    Task<LoginResult> LoginAsync(LoginRequest request);
    Task<LoginResponse> VerifyTwoFactorLoginAsync(TwoFactorVerifyRequest request);
    Task<RefreshTokenResponse> RefreshAsync(RefreshTokenRequest request);
    Task LogoutAsync(LogoutRequest request);
    Task<UserResponse> GetMeAsync(Guid userId);
    Task VerifyPasswordAsync(Guid userId, VerifyPasswordRequest request);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task<TwoFactorSetupResponse> SetupTwoFactorAsync(Guid userId);
    Task<TwoFactorEnableResponse> EnableTwoFactorAsync(Guid userId, TwoFactorEnableRequest request);
    Task DisableTwoFactorAsync(Guid userId, TwoFactorDisableRequest request);
}

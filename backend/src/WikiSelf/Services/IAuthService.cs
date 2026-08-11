using WikiSelf.DTOs.Auth;
using WikiSelf.DTOs.Users;

namespace WikiSelf.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<RefreshTokenResponse> RefreshAsync(RefreshTokenRequest request);
    Task LogoutAsync(LogoutRequest request);
    Task<UserResponse> GetMeAsync(Guid userId);
    Task VerifyPasswordAsync(Guid userId, VerifyPasswordRequest request);
}

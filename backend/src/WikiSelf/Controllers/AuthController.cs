using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WikiSelf.DTOs.Auth;
using WikiSelf.Services;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUser;

    public AuthController(IAuthService authService, ICurrentUserService currentUser)
    {
        _authService = authService;
        _currentUser = currentUser;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResult>> Login(LoginRequest request)
    {
        return Ok(await _authService.LoginAsync(request));
    }

    [HttpPost("2fa/verify")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> VerifyTwoFactor(TwoFactorVerifyRequest request)
    {
        return Ok(await _authService.VerifyTwoFactorLoginAsync(request));
    }

    [HttpPost("2fa/setup")]
    [Authorize]
    public async Task<ActionResult<TwoFactorSetupResponse>> SetupTwoFactor()
    {
        return Ok(await _authService.SetupTwoFactorAsync(_currentUser.UserId));
    }

    [HttpPost("2fa/enable")]
    [Authorize]
    public async Task<ActionResult<TwoFactorEnableResponse>> EnableTwoFactor(TwoFactorEnableRequest request)
    {
        return Ok(await _authService.EnableTwoFactorAsync(_currentUser.UserId, request));
    }

    [HttpPost("2fa/disable")]
    [Authorize]
    public async Task<IActionResult> DisableTwoFactor(TwoFactorDisableRequest request)
    {
        await _authService.DisableTwoFactorAsync(_currentUser.UserId, request);
        return NoContent();
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<RefreshTokenResponse>> Refresh(RefreshTokenRequest request)
    {
        return Ok(await _authService.RefreshAsync(request));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(LogoutRequest request)
    {
        await _authService.LogoutAsync(request);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        return Ok(await _authService.GetMeAsync(_currentUser.UserId));
    }

    [HttpPost("verify-password")]
    [Authorize]
    public async Task<IActionResult> VerifyPassword(VerifyPasswordRequest request)
    {
        await _authService.VerifyPasswordAsync(_currentUser.UserId, request);
        return NoContent();
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        await _authService.ChangePasswordAsync(_currentUser.UserId, request);
        return NoContent();
    }
}

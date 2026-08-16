using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WikiSelf.DTOs.Auth;
using WikiSelf.Services;
using WikiSelf.Services.Auth;
using WikiSelf.Services.Exceptions;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const string RefreshTokenCookieName = "wikiself_refresh_token";

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
        var outcome = await _authService.LoginAsync(request);
        if (outcome.Tokens is null)
        {
            return Ok(new LoginResult(true, outcome.ChallengeToken, null));
        }

        return Ok(new LoginResult(false, null, IssueLoginResponse(outcome.Tokens)));
    }

    [HttpPost("2fa/verify")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> VerifyTwoFactor(TwoFactorVerifyRequest request)
    {
        var tokens = await _authService.VerifyTwoFactorLoginAsync(request);
        return Ok(IssueLoginResponse(tokens));
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
    public async Task<ActionResult<RefreshTokenResponse>> Refresh()
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName];
        if (string.IsNullOrEmpty(refreshToken))
        {
            throw new UnauthorizedAppException("Invalid or expired refresh token.");
        }

        var tokens = await _authService.RefreshAsync(refreshToken);
        SetRefreshTokenCookie(tokens.RefreshToken, tokens.RefreshTokenExpiresAt);
        return Ok(new RefreshTokenResponse(tokens.AccessToken, tokens.AccessTokenExpiresAt));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName];
        await _authService.LogoutAsync(refreshToken);
        ClearRefreshTokenCookie();
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

    private LoginResponse IssueLoginResponse(TokenIssuance issuance)
    {
        SetRefreshTokenCookie(issuance.Tokens.RefreshToken, issuance.Tokens.RefreshTokenExpiresAt);
        return new LoginResponse(issuance.Tokens.AccessToken, issuance.Tokens.AccessTokenExpiresAt, issuance.User);
    }

    private void SetRefreshTokenCookie(string refreshToken, DateTime expiresAt)
    {
        // Secure is tied to the actual scheme of the incoming request rather than hardcoded true,
        // because self-hosted deployments may run behind a reverse proxy without TLS (plain HTTP on
        // the LAN); a hardcoded Secure flag would silently break refresh on those setups.
        Response.Cookies.Append(RefreshTokenCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth",
            Expires = new DateTimeOffset(expiresAt, TimeSpan.Zero)
        });
    }

    private void ClearRefreshTokenCookie()
    {
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions { Path = "/api/auth" });
    }
}

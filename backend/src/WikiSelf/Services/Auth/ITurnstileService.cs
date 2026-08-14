namespace WikiSelf.Services.Auth;

public interface ITurnstileService
{
    Task<bool> VerifyAsync(string? token);
}

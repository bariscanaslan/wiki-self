using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace WikiSelf.Services.Auth;

public class TurnstileService : ITurnstileService
{
    private const string VerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TurnstileSettings _settings;

    public TurnstileService(IHttpClientFactory httpClientFactory, IHttpContextAccessor httpContextAccessor, IOptions<TurnstileSettings> settings)
    {
        _httpClientFactory = httpClientFactory;
        _httpContextAccessor = httpContextAccessor;
        _settings = settings.Value;
    }

    public async Task<bool> VerifyAsync(string? token)
    {
        if (!_settings.Enabled)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        var remoteIp = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

        var client = _httpClientFactory.CreateClient();
        var formValues = new Dictionary<string, string>
        {
            ["secret"] = _settings.SecretKey,
            ["response"] = token
        };
        if (!string.IsNullOrEmpty(remoteIp))
        {
            formValues["remoteip"] = remoteIp;
        }

        using var response = await client.PostAsync(VerifyUrl, new FormUrlEncodedContent(formValues));
        if (!response.IsSuccessStatusCode)
        {
            return false;
        }

        var result = await response.Content.ReadFromJsonAsync<TurnstileVerifyResponse>();
        return result?.Success ?? false;
    }

    private class TurnstileVerifyResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
    }
}

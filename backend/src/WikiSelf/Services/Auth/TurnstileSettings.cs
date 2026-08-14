namespace WikiSelf.Services.Auth;

public class TurnstileSettings
{
    public bool Enabled { get; set; }
    public string SiteKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
}

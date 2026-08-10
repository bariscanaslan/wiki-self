using Microsoft.AspNetCore.Http;
using WikiSelf.DTOs.Settings;
using WikiSelf.DTOs.Users;

namespace WikiSelf.DTOs.Setup;

public record SetupStatusResponse(bool IsInitialized);

public class SetupInitializeRequest
{
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminPassword { get; set; } = string.Empty;
    public string AdminDisplayName { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string SiteTitle { get; set; } = string.Empty;
    public string? MetaDescription { get; set; }
    public IFormFile? Logo { get; set; }
    public IFormFile? Favicon { get; set; }
}

public record SetupInitializeResponse(UserResponse Admin, SiteSettingsResponse Settings);

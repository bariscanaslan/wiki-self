namespace WikiSelf.DTOs.Settings;

public record SiteSettingsResponse(
    string CompanyName,
    string? LogoUrl,
    string SiteTitle,
    string? MetaDescription,
    string? FaviconUrl,
    string UiFont,
    string DocumentFont,
    bool IsInitialized);

public record UpdateSiteSettingsRequest(
    string CompanyName,
    string SiteTitle,
    string? MetaDescription,
    string UiFont,
    string DocumentFont,
    Guid? LogoAssetId,
    Guid? FaviconAssetId);

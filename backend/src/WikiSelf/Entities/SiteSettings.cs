namespace WikiSelf.Entities;

public class SiteSettings
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public Guid? LogoAssetId { get; set; }
    public Asset? LogoAsset { get; set; }
    public string SiteTitle { get; set; } = string.Empty;
    public string? MetaDescription { get; set; }
    public Guid? FaviconAssetId { get; set; }
    public Asset? FaviconAsset { get; set; }
    public string UiFont { get; set; } = string.Empty;
    public string DocumentFont { get; set; } = string.Empty;
    public bool IsInitialized { get; set; }
}

using Microsoft.EntityFrameworkCore;
using WikiSelf.Data;
using WikiSelf.DTOs.Settings;
using WikiSelf.Entities;
using WikiSelf.Services.Exceptions;

namespace WikiSelf.Services;

public class SettingsService : ISettingsService
{
    private readonly AppDbContext _db;

    public SettingsService(AppDbContext db)
    {
        _db = db;
    }

    private static SiteSettingsResponse ToResponse(SiteSettings settings)
    {
        return new SiteSettingsResponse(
            settings.CompanyName,
            settings.LogoAssetId.HasValue ? $"/api/assets/{settings.LogoAssetId}/file" : null,
            settings.SiteTitle,
            settings.MetaDescription,
            settings.FaviconAssetId.HasValue ? $"/api/assets/{settings.FaviconAssetId}/file" : null,
            settings.UiFont,
            settings.DocumentFont,
            settings.IsInitialized);
    }

    public async Task<SiteSettingsResponse> GetAsync()
    {
        var settings = await _db.SiteSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1)
                        ?? throw new NotFoundException("Site settings not found.");

        return ToResponse(settings);
    }

    public async Task<SiteSettingsResponse> UpdateAsync(UpdateSiteSettingsRequest request)
    {
        var settings = await _db.SiteSettings.FirstOrDefaultAsync(s => s.Id == 1)
                        ?? throw new NotFoundException("Site settings not found.");

        if (request.LogoAssetId.HasValue)
        {
            var exists = await _db.Assets.AnyAsync(a => a.Id == request.LogoAssetId.Value);
            if (!exists)
            {
                throw new NotFoundException("Logo asset not found.");
            }
        }

        if (request.FaviconAssetId.HasValue)
        {
            var exists = await _db.Assets.AnyAsync(a => a.Id == request.FaviconAssetId.Value);
            if (!exists)
            {
                throw new NotFoundException("Favicon asset not found.");
            }
        }

        settings.CompanyName = request.CompanyName;
        settings.SiteTitle = request.SiteTitle;
        settings.MetaDescription = request.MetaDescription;
        settings.UiFont = request.UiFont;
        settings.DocumentFont = request.DocumentFont;
        settings.LogoAssetId = request.LogoAssetId;
        settings.FaviconAssetId = request.FaviconAssetId;

        await _db.SaveChangesAsync();

        return ToResponse(settings);
    }
}

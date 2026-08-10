using Microsoft.EntityFrameworkCore;
using WikiSelf.Data;
using WikiSelf.DTOs.Setup;
using WikiSelf.DTOs.Settings;
using WikiSelf.DTOs.Users;
using WikiSelf.Entities;
using WikiSelf.Services.Exceptions;

namespace WikiSelf.Services;

public class SetupService : ISetupService
{
    private readonly AppDbContext _db;
    private readonly IAssetService _assetService;

    public SetupService(AppDbContext db, IAssetService assetService)
    {
        _db = db;
        _assetService = assetService;
    }

    public async Task<SetupStatusResponse> GetStatusAsync()
    {
        var settings = await _db.SiteSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1);
        return new SetupStatusResponse(settings?.IsInitialized ?? false);
    }

    public async Task<SetupInitializeResponse> InitializeAsync(SetupInitializeRequest request)
    {
        var settings = await _db.SiteSettings.FirstOrDefaultAsync(s => s.Id == 1)
                        ?? throw new NotFoundException("Site settings not found.");

        if (settings.IsInitialized)
        {
            throw new ConflictException("Setup has already been completed.");
        }

        var emailExists = await _db.Users.AnyAsync(u => u.Email == request.AdminEmail);
        if (emailExists)
        {
            throw new ConflictException("A user with this email already exists.");
        }

        var admin = new User
        {
            Id = Guid.NewGuid(),
            Email = request.AdminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.AdminPassword),
            DisplayName = request.AdminDisplayName,
            IsAdmin = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(admin);
        await _db.SaveChangesAsync();

        if (request.Logo is not null)
        {
            var logoAsset = await _assetService.UploadAsync(admin.Id, request.Logo, null);
            settings.LogoAssetId = logoAsset.Id;
        }

        if (request.Favicon is not null)
        {
            var faviconAsset = await _assetService.UploadAsync(admin.Id, request.Favicon, null);
            settings.FaviconAssetId = faviconAsset.Id;
        }

        settings.CompanyName = request.CompanyName;
        settings.SiteTitle = request.SiteTitle;
        settings.MetaDescription = request.MetaDescription;
        settings.IsInitialized = true;

        await _db.SaveChangesAsync();

        var userResponse = new UserResponse(admin.Id, admin.Email, admin.DisplayName, admin.IsAdmin, admin.IsActive, admin.CreatedAt, []);

        var settingsResponse = new SiteSettingsResponse(
            settings.CompanyName,
            settings.LogoAssetId.HasValue ? $"/api/assets/{settings.LogoAssetId}/file" : null,
            settings.SiteTitle,
            settings.MetaDescription,
            settings.FaviconAssetId.HasValue ? $"/api/assets/{settings.FaviconAssetId}/file" : null,
            settings.UiFont,
            settings.DocumentFont,
            settings.IsInitialized);

        return new SetupInitializeResponse(userResponse, settingsResponse);
    }
}

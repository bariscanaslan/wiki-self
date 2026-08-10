using WikiSelf.DTOs.Settings;

namespace WikiSelf.Services;

public interface ISettingsService
{
    Task<SiteSettingsResponse> GetAsync();
    Task<SiteSettingsResponse> UpdateAsync(UpdateSiteSettingsRequest request);
}

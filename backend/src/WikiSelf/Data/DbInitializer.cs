using Microsoft.EntityFrameworkCore;
using WikiSelf.Entities;

namespace WikiSelf.Data;

public static class DbInitializer
{
    public static async Task EnsureSiteSettingsExistAsync(AppDbContext context)
    {
        var exists = await context.SiteSettings.AnyAsync(s => s.Id == 1);
        if (exists)
        {
            return;
        }

        context.SiteSettings.Add(new SiteSettings
        {
            Id = 1,
            CompanyName = string.Empty,
            SiteTitle = string.Empty,
            UiFont = "Inter",
            DocumentFont = "Inter",
            IsInitialized = false
        });

        await context.SaveChangesAsync();
    }
}

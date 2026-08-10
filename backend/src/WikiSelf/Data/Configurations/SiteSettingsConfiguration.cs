using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WikiSelf.Entities;

namespace WikiSelf.Data.Configurations;

public class SiteSettingsConfiguration : IEntityTypeConfiguration<SiteSettings>
{
    public void Configure(EntityTypeBuilder<SiteSettings> builder)
    {
        builder.ToTable("SiteSettings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.CompanyName).HasMaxLength(256);
        builder.Property(s => s.SiteTitle).HasMaxLength(256);
        builder.Property(s => s.MetaDescription).HasMaxLength(512);
        builder.Property(s => s.UiFont).HasMaxLength(128);
        builder.Property(s => s.DocumentFont).HasMaxLength(128);

        builder.HasOne(s => s.LogoAsset)
            .WithMany()
            .HasForeignKey(s => s.LogoAssetId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(s => s.FaviconAsset)
            .WithMany()
            .HasForeignKey(s => s.FaviconAssetId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasData(new SiteSettings
        {
            Id = 1,
            CompanyName = string.Empty,
            SiteTitle = string.Empty,
            UiFont = "Inter",
            DocumentFont = "Inter",
            IsInitialized = false
        });
    }
}

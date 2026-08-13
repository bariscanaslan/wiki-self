using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NpgsqlTypes;
using WikiSelf.Entities;

namespace WikiSelf.Data.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.ToTable("Documents");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Title)
            .IsRequired()
            .HasMaxLength(512);

        builder.Property(d => d.SearchContent)
            .IsRequired()
            .HasDefaultValue(string.Empty);

        builder.HasGeneratedTsVectorColumn(
                d => d.SearchVector,
                "english",
                d => new { d.Title, d.SearchContent })
            .HasIndex(d => d.SearchVector)
            .HasMethod("GIN");

        builder.Property(d => d.CreatedAt)
            .HasDefaultValueSql("now()");

        builder.Property(d => d.UpdatedAt)
            .HasDefaultValueSql("now()");

        builder.HasOne(d => d.Folder)
            .WithMany(f => f.Documents)
            .HasForeignKey(d => d.FolderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.CreatedByUser)
            .WithMany()
            .HasForeignKey(d => d.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.CurrentVersion)
            .WithMany()
            .HasForeignKey(d => d.CurrentVersionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

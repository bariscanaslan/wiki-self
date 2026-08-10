using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WikiSelf.Entities;

namespace WikiSelf.Data.Configurations;

public class DocumentVersionConfiguration : IEntityTypeConfiguration<DocumentVersion>
{
    public void Configure(EntityTypeBuilder<DocumentVersion> builder)
    {
        builder.ToTable("DocumentVersions");

        builder.HasKey(dv => dv.Id);

        builder.Property(dv => dv.ContentJson)
            .IsRequired()
            .HasColumnType("jsonb");

        builder.Property(dv => dv.ContentMarkdown)
            .IsRequired();

        builder.Property(dv => dv.CreatedAt)
            .HasDefaultValueSql("now()");

        builder.HasIndex(dv => new { dv.DocumentId, dv.VersionNumber }).IsUnique();

        builder.HasOne(dv => dv.Document)
            .WithMany(d => d.Versions)
            .HasForeignKey(dv => dv.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(dv => dv.AuthorUser)
            .WithMany()
            .HasForeignKey(dv => dv.AuthorUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

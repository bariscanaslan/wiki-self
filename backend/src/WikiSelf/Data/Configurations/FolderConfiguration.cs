using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WikiSelf.Entities;

namespace WikiSelf.Data.Configurations;

public class FolderConfiguration : IEntityTypeConfiguration<Folder>
{
    public void Configure(EntityTypeBuilder<Folder> builder)
    {
        builder.ToTable("Folders");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Name)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(f => f.MaterializedPath)
            .IsRequired()
            .HasMaxLength(2048);

        builder.Property(f => f.Icon)
            .HasMaxLength(64);

        builder.HasIndex(f => f.MaterializedPath);
        builder.HasIndex(f => f.ParentId);

        builder.Property(f => f.CreatedAt)
            .HasDefaultValueSql("now()");

        builder.HasOne(f => f.Parent)
            .WithMany(f => f.Children)
            .HasForeignKey(f => f.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.CreatedByUser)
            .WithMany()
            .HasForeignKey(f => f.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

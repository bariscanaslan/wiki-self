using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WikiSelf.Entities;

namespace WikiSelf.Data.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Details)
            .HasColumnType("jsonb");

        builder.Property(a => a.Timestamp)
            .HasDefaultValueSql("now()");

        builder.HasIndex(a => new { a.ResourceType, a.ResourceId });
        builder.HasIndex(a => a.Timestamp);
        builder.HasIndex(a => a.UserId);

        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.ActivityType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.EntityType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.EntityId)
            .HasMaxLength(50);

        builder.Property(a => a.UserId)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.UserName)
            .HasMaxLength(255);

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(a => a.Description)
            .HasMaxLength(1000);

        builder.Property(a => a.OldValues)
            .HasColumnType("nvarchar(max)");

        builder.Property(a => a.NewValues)
            .HasColumnType("nvarchar(max)");

        builder.Property(a => a.Timestamp)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(a => a.IpAddress)
            .HasMaxLength(45);

        builder.Property(a => a.UserAgent)
            .HasMaxLength(500);

        builder.Property(a => a.Severity)
            .HasMaxLength(20)
            .HasDefaultValue("Info");

        builder.Property(a => a.Icon)
            .HasMaxLength(50);

        builder.Property(a => a.Metadata)
            .HasColumnType("nvarchar(max)");

        builder.Property(a => a.IsArchived)
            .HasDefaultValue(false);

        builder.Property(a => a.SessionId)
            .HasMaxLength(100);

        // Indexes for better query performance
        builder.HasIndex(a => a.Timestamp)
            .HasDatabaseName("IX_AuditLogs_Timestamp");

        builder.HasIndex(a => a.UserId)
            .HasDatabaseName("IX_AuditLogs_UserId");

        builder.HasIndex(a => a.EntityType)
            .HasDatabaseName("IX_AuditLogs_EntityType");

        builder.HasIndex(a => a.ActivityType)
            .HasDatabaseName("IX_AuditLogs_ActivityType");

        builder.HasIndex(a => new { a.EntityType, a.EntityId })
            .HasDatabaseName("IX_AuditLogs_Entity");

        builder.HasIndex(a => a.IsArchived)
            .HasDatabaseName("IX_AuditLogs_IsArchived");
    }
}

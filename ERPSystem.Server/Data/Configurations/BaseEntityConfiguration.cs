using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ERPSystem.Server.Data.Configurations;

/// <summary>
/// Base class for entity configurations providing common audit properties setup
/// </summary>
public abstract class BaseEntityConfiguration<T> : IEntityTypeConfiguration<T> where T : class
{
    public abstract void Configure(EntityTypeBuilder<T> builder);

    /// <summary>
    /// Configures standard audit properties for entities with soft delete support
    /// </summary>
    protected static void ConfigureAuditProperties(EntityTypeBuilder<T> entity)
    {
        entity.Property("IsDeleted")
            .HasDefaultValue(false);

        entity.Property("CreatedAt")
            .HasDefaultValueSql("GETUTCDATE()");

        entity.Property("UpdatedAt")
            .HasDefaultValueSql("GETUTCDATE()");
    }

    /// <summary>
    /// Configures soft delete query filter for entities
    /// </summary>
    protected static void ConfigureSoftDeleteFilter(EntityTypeBuilder<T> entity)
    {
        entity.HasQueryFilter(e => !EF.Property<bool>(e, "IsDeleted"));
    }
}

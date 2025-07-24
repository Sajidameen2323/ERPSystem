using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations.Inventory;

/// <summary>
/// Entity configuration for Product entity
/// </summary>
public class ProductConfiguration : BaseEntityConfiguration<Product>
{
    public override void Configure(EntityTypeBuilder<Product> builder)
    {
        // Primary Key
        builder.HasKey(e => e.Id);
        
        // Required Fields
        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(e => e.SKU)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.Description)
            .HasMaxLength(1000);

        // Financial Properties
        builder.Property(e => e.UnitPrice)
            .HasPrecision(18, 2);

        builder.Property(e => e.CostPrice)
            .HasPrecision(18, 2);

        // Stock Properties
        builder.Property(e => e.CurrentStock)
            .HasDefaultValue(0);

        // Audit Properties
        ConfigureAuditProperties(builder);

        // Indexes
        builder.HasIndex(e => e.SKU)
            .IsUnique()
            .HasDatabaseName("IX_Product_SKU");

        // Soft Delete Filter
        ConfigureSoftDeleteFilter(builder);
    }
}

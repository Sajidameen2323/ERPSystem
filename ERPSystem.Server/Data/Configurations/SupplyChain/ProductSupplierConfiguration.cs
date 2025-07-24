using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations.SupplyChain;

/// <summary>
/// Entity configuration for ProductSupplier entity
/// </summary>
public class ProductSupplierConfiguration : BaseEntityConfiguration<ProductSupplier>
{
    public override void Configure(EntityTypeBuilder<ProductSupplier> builder)
    {
        // Primary Key
        builder.HasKey(e => e.Id);

        // Required Fields
        builder.Property(e => e.SupplierSKU)
            .IsRequired()
            .HasMaxLength(50);

        // Financial Properties
        builder.Property(e => e.SupplierPrice)
            .HasPrecision(18, 2);

        // Business Properties
        builder.Property(e => e.MinimumOrderQuantity)
            .HasDefaultValue(1);

        builder.Property(e => e.LeadTimeDays)
            .HasDefaultValue(0);

        builder.Property(e => e.IsPreferredSupplier)
            .HasDefaultValue(false);

        builder.Property(e => e.IsActive)
            .HasDefaultValue(true);

        // Audit Properties
        ConfigureAuditProperties(builder);

        // Relationships
        builder.HasOne(e => e.Product)
            .WithMany(p => p.ProductSuppliers)
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Supplier)
            .WithMany(s => s.ProductSuppliers)
            .HasForeignKey(e => e.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => new { e.ProductId, e.SupplierId })
            .HasDatabaseName("IX_ProductSupplier_ProductId_SupplierId");

        builder.HasIndex(e => e.SupplierSKU)
            .HasDatabaseName("IX_ProductSupplier_SupplierSKU");

        // Soft Delete Filter
        ConfigureSoftDeleteFilter(builder);
    }
}

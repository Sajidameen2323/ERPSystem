using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations.SupplyChain;

/// <summary>
/// Entity configuration for PurchaseOrderItem entity
/// </summary>
public class PurchaseOrderItemConfiguration : BaseEntityConfiguration<PurchaseOrderItem>
{
    public override void Configure(EntityTypeBuilder<PurchaseOrderItem> builder)
    {
        // Primary Key
        builder.HasKey(e => e.Id);

        // Required Fields
        builder.Property(e => e.OrderedQuantity)
            .IsRequired();

        // Business Properties
        builder.Property(e => e.ReceivedQuantity)
            .HasDefaultValue(0);

        // Financial Properties
        builder.Property(e => e.UnitPrice)
            .HasPrecision(18, 2);

        // Optional Fields
        builder.Property(e => e.Notes)
            .HasMaxLength(500);

        // Audit Properties
        ConfigureAuditProperties(builder);

        // Relationships
        builder.HasOne(e => e.PurchaseOrder)
            .WithMany(po => po.Items)
            .HasForeignKey(e => e.PurchaseOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Product)
            .WithMany(p => p.PurchaseOrderItems)
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => e.PurchaseOrderId)
            .HasDatabaseName("IX_PurchaseOrderItem_PurchaseOrderId");

        builder.HasIndex(e => e.ProductId)
            .HasDatabaseName("IX_PurchaseOrderItem_ProductId");

        // Soft Delete Filter
        ConfigureSoftDeleteFilter(builder);
    }
}

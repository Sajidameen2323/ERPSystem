using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations.SupplyChain;

/// <summary>
/// Entity configuration for PurchaseOrderReturnItem entity
/// </summary>
public class PurchaseOrderReturnItemConfiguration : BaseEntityConfiguration<PurchaseOrderReturnItem>
{
    public override void Configure(EntityTypeBuilder<PurchaseOrderReturnItem> builder)
    {
        // Primary Key
        builder.HasKey(e => e.Id);

        // Required Fields
        builder.Property(e => e.ReturnQuantity)
            .IsRequired();

        builder.Property(e => e.UnitPrice)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(e => e.TotalReturnAmount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        // Indexes
        builder.HasIndex(e => e.PurchaseOrderReturnId)
            .HasDatabaseName("IX_PurchaseOrderReturnItem_PurchaseOrderReturnId");

        builder.HasIndex(e => e.ProductId)
            .HasDatabaseName("IX_PurchaseOrderReturnItem_ProductId");

        builder.HasIndex(e => e.PurchaseOrderItemId)
            .HasDatabaseName("IX_PurchaseOrderReturnItem_PurchaseOrderItemId");

        // Relationships
        builder.HasOne(e => e.PurchaseOrderReturn)
            .WithMany(e => e.Items)
            .HasForeignKey(e => e.PurchaseOrderReturnId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.PurchaseOrderItem)
            .WithMany()
            .HasForeignKey(e => e.PurchaseOrderItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // Soft Delete Filter
        ConfigureSoftDeleteFilter(builder);
    }
}

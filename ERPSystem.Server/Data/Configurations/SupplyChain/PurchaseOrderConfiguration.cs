using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations.SupplyChain;

/// <summary>
/// Entity configuration for PurchaseOrder entity
/// </summary>
public class PurchaseOrderConfiguration : BaseEntityConfiguration<PurchaseOrder>
{
    public override void Configure(EntityTypeBuilder<PurchaseOrder> builder)
    {
        // Primary Key
        builder.HasKey(e => e.Id);

        // Required Fields
        builder.Property(e => e.PONumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.CreatedByUserId)
            .IsRequired()
            .HasMaxLength(255);

        // Optional Fields
        builder.Property(e => e.ApprovedByUserId)
            .HasMaxLength(255);

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        // Business Properties
        builder.Property(e => e.Status)
            .HasDefaultValue(PurchaseOrderStatus.Draft);

        builder.Property(e => e.OrderDate)
            .HasDefaultValueSql("GETUTCDATE()");

        // Financial Properties
        builder.Property(e => e.TotalAmount)
            .HasPrecision(18, 2);

        // Audit Properties
        ConfigureAuditProperties(builder);

        // Relationships
        builder.HasOne(e => e.Supplier)
            .WithMany(s => s.PurchaseOrders)
            .HasForeignKey(e => e.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => e.PONumber)
            .IsUnique()
            .HasDatabaseName("IX_PurchaseOrder_PONumber");

        builder.HasIndex(e => e.SupplierId)
            .HasDatabaseName("IX_PurchaseOrder_SupplierId");

        builder.HasIndex(e => e.Status)
            .HasDatabaseName("IX_PurchaseOrder_Status");

        builder.HasIndex(e => e.OrderDate)
            .HasDatabaseName("IX_PurchaseOrder_OrderDate");

        // Soft Delete Filter
        ConfigureSoftDeleteFilter(builder);
    }
}

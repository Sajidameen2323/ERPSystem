using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations.SupplyChain;

/// <summary>
/// Entity configuration for PurchaseOrderReturn entity
/// </summary>
public class PurchaseOrderReturnConfiguration : BaseEntityConfiguration<PurchaseOrderReturn>
{
    public override void Configure(EntityTypeBuilder<PurchaseOrderReturn> builder)
    {
        // Primary Key
        builder.HasKey(e => e.Id);

        // Required Fields
        builder.Property(e => e.ReturnNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.CreatedByUserId)
            .IsRequired();

        builder.Property(e => e.TotalReturnAmount)
            .HasColumnType("decimal(18,2)");

        // Indexes
        builder.HasIndex(e => e.ReturnNumber)
            .IsUnique()
            .HasDatabaseName("IX_PurchaseOrderReturn_ReturnNumber");

        builder.HasIndex(e => e.PurchaseOrderId)
            .HasDatabaseName("IX_PurchaseOrderReturn_PurchaseOrderId");

        builder.HasIndex(e => e.SupplierId)
            .HasDatabaseName("IX_PurchaseOrderReturn_SupplierId");

        builder.HasIndex(e => e.ReturnDate)
            .HasDatabaseName("IX_PurchaseOrderReturn_ReturnDate");

        // Relationships
        builder.HasOne(e => e.PurchaseOrder)
            .WithMany()
            .HasForeignKey(e => e.PurchaseOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Supplier)
            .WithMany()
            .HasForeignKey(e => e.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Items)
            .WithOne(e => e.PurchaseOrderReturn)
            .HasForeignKey(e => e.PurchaseOrderReturnId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft Delete Filter
        ConfigureSoftDeleteFilter(builder);
    }
}

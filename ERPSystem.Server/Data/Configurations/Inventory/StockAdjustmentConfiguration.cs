using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations.Inventory;

/// <summary>
/// Entity configuration for StockAdjustment entity
/// </summary>
public class StockAdjustmentConfiguration : BaseEntityConfiguration<StockAdjustment>
{
    public override void Configure(EntityTypeBuilder<StockAdjustment> builder)
    {
        // Primary Key
        builder.HasKey(e => e.Id);

        // Required Fields
        builder.Property(e => e.Reason)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(e => e.AdjustedByUserId)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(e => e.AdjustedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // Audit Properties
        ConfigureAuditProperties(builder);

        // Relationships
        builder.HasOne(e => e.Product)
            .WithMany(p => p.StockAdjustments)
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => e.ProductId)
            .HasDatabaseName("IX_StockAdjustment_ProductId");

        builder.HasIndex(e => e.AdjustedAt)
            .HasDatabaseName("IX_StockAdjustment_AdjustedAt");

        // Soft Delete Filter
        ConfigureSoftDeleteFilter(builder);
    }
}

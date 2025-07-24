using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations.Inventory;

/// <summary>
/// Entity configuration for StockMovement entity
/// </summary>
public class StockMovementConfiguration : BaseEntityConfiguration<StockMovement>
{
    public override void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        // Primary Key
        builder.HasKey(e => e.Id);

        // Required Fields
        builder.Property(e => e.Reason)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.MovedByUserId)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(e => e.MovementDate)
            .HasDefaultValueSql("GETUTCDATE()");

        // Optional Fields
        builder.Property(e => e.Reference)
            .HasMaxLength(255);

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        // Audit Properties
        ConfigureAuditProperties(builder);

        // Relationships
        builder.HasOne(e => e.Product)
            .WithMany(p => p.StockMovements)
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(e => e.ProductId)
            .HasDatabaseName("IX_StockMovement_ProductId");

        builder.HasIndex(e => e.MovementDate)
            .HasDatabaseName("IX_StockMovement_MovementDate");

        builder.HasIndex(e => e.MovementType)
            .HasDatabaseName("IX_StockMovement_MovementType");

        // Soft Delete Filter
        ConfigureSoftDeleteFilter(builder);
    }
}

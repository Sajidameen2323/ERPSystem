using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations.Sales;

/// <summary>
/// Entity configuration for SalesOrderItem entity
/// </summary>
public class SalesOrderItemConfiguration : BaseEntityConfiguration<SalesOrderItem>
{
    public override void Configure(EntityTypeBuilder<SalesOrderItem> builder)
    {
        // Primary Key
        builder.HasKey(oi => oi.Id);

        // Table name
        builder.ToTable("SalesOrderItems");

        // Properties
        builder.Property(oi => oi.Quantity)
            .IsRequired();

        builder.Property(oi => oi.UnitPriceAtTimeOfOrder)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(oi => oi.LineTotal)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(oi => oi.Notes)
            .HasMaxLength(500);

        // Indexes
        builder.HasIndex(oi => oi.SalesOrderId)
            .HasDatabaseName("IX_SalesOrderItems_SalesOrderId");

        builder.HasIndex(oi => oi.ProductId)
            .HasDatabaseName("IX_SalesOrderItems_ProductId");

        // Audit Properties
        ConfigureAuditProperties(builder);

        // Navigation properties
        builder.HasOne(oi => oi.SalesOrder)
            .WithMany(so => so.SalesOrderItems)
            .HasForeignKey(oi => oi.SalesOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(oi => oi.Product)
            .WithMany()
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Soft Delete Filter
        ConfigureSoftDeleteFilter(builder);
    }
}

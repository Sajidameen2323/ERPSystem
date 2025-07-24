using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;
using ERPSystem.Server.Models.Enums;

namespace ERPSystem.Server.Data.Configurations.Sales;

/// <summary>
/// Entity configuration for SalesOrder entity
/// </summary>
public class SalesOrderConfiguration : BaseEntityConfiguration<SalesOrder>
{
    public override void Configure(EntityTypeBuilder<SalesOrder> builder)
    {
        // Primary Key
        builder.HasKey(so => so.Id);

        // Properties
        builder.Property(so => so.Status)
            .IsRequired()
            .HasConversion<int>(); // Store enum as int

        builder.Property(so => so.TotalAmount)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(so => so.OrderedByUserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(so => so.OrderNotes)
            .HasMaxLength(1000);

        builder.Property(so => so.ReferenceNumber)
            .HasMaxLength(100);

        // Indexes
        builder.HasIndex(so => so.CustomerId)
            .HasDatabaseName("IX_SalesOrders_CustomerId");

        builder.HasIndex(so => so.OrderDate)
            .HasDatabaseName("IX_SalesOrders_OrderDate");

        builder.HasIndex(so => so.Status)
            .HasDatabaseName("IX_SalesOrders_Status");

        builder.HasIndex(so => so.OrderedByUserId)
            .HasDatabaseName("IX_SalesOrders_OrderedByUserId");

        // Audit properties
        builder.Property(so => so.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(so => so.UpdatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // Audit Properties
        ConfigureAuditProperties(builder);

        // Navigation properties
        builder.HasOne(so => so.Customer)
            .WithMany(c => c.SalesOrders)
            .HasForeignKey(so => so.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(so => so.SalesOrderItems)
            .WithOne(oi => oi.SalesOrder)
            .HasForeignKey(oi => oi.SalesOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft Delete Filter
        ConfigureSoftDeleteFilter(builder);
    }
}

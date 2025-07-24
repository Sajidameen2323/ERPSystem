using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations.Sales;

/// <summary>
/// Entity configuration for Customer entity
/// </summary>
public class CustomerConfiguration : BaseEntityConfiguration<Customer>
{
    public override void Configure(EntityTypeBuilder<Customer> builder)
    {
        // Primary Key
        builder.HasKey(c => c.Id);

        // Properties
        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(c => c.Email)
            .HasMaxLength(255);

        builder.Property(c => c.Phone)
            .HasMaxLength(50);

        builder.Property(c => c.Address)
            .HasMaxLength(500);

        // Indexes
        builder.HasIndex(c => c.Email)
            .IsUnique()
            .HasFilter("[Email] IS NOT NULL AND [IsDeleted] = 0");

        builder.HasIndex(c => c.Name)
            .HasDatabaseName("IX_Customers_Name");

        builder.HasIndex(c => c.IsDeleted)
            .HasDatabaseName("IX_Customers_IsDeleted");

        // Audit properties
        ConfigureAuditProperties(builder);

        // Navigation properties
        builder.HasMany(c => c.SalesOrders)
            .WithOne(so => so.Customer)
            .HasForeignKey(so => so.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Soft Delete Filter
        ConfigureSoftDeleteFilter(builder);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations.SupplyChain;

/// <summary>
/// Entity configuration for Supplier entity
/// </summary>
public class SupplierConfiguration : BaseEntityConfiguration<Supplier>
{
    public override void Configure(EntityTypeBuilder<Supplier> builder)
    {
        // Primary Key
        builder.HasKey(e => e.Id);

        // Required Fields
        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(e => e.ContactPerson)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(e => e.Phone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(e => e.Address)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Country)
            .IsRequired()
            .HasMaxLength(100);

        // Optional Fields
        builder.Property(e => e.PostalCode)
            .HasMaxLength(20);

        builder.Property(e => e.VatNumber)
            .HasMaxLength(50);

        builder.Property(e => e.SupplierCode)
            .HasMaxLength(20);

        builder.Property(e => e.PaymentTerms)
            .HasMaxLength(100);

        // Financial Properties
        builder.Property(e => e.CreditLimit)
            .HasPrecision(18, 2);

        builder.Property(e => e.TotalPurchases)
            .HasPrecision(18, 2)
            .HasDefaultValue(0);

        // Status Properties
        builder.Property(e => e.PerformanceRating)
            .HasDefaultValue(0);

        builder.Property(e => e.IsActive)
            .HasDefaultValue(true);

        // Audit Properties
        ConfigureAuditProperties(builder);

        // Indexes
        builder.HasIndex(e => e.Email)
            .IsUnique()
            .HasDatabaseName("IX_Supplier_Email");

        // Soft Delete Filter
        ConfigureSoftDeleteFilter(builder);
    }
}

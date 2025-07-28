using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data.Configurations;

public class StockReservationConfiguration : IEntityTypeConfiguration<StockReservation>
{
    public void Configure(EntityTypeBuilder<StockReservation> builder)
    {
        // Primary key
        builder.HasKey(sr => sr.Id);

        // Properties
        builder.Property(sr => sr.ReservedQuantity)
            .IsRequired();

        builder.Property(sr => sr.Reference)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(sr => sr.ReservedByUserId)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(sr => sr.ReservedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(sr => sr.Reason)
            .HasMaxLength(500);

        builder.Property(sr => sr.Notes)
            .HasMaxLength(1000);

        builder.Property(sr => sr.IsReleased)
            .IsRequired()
            .HasDefaultValue(false);

        // Audit fields
        builder.Property(sr => sr.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(sr => sr.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(sr => sr.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Relationships
        builder.HasOne(sr => sr.Product)
            .WithMany(p => p.StockReservations)
            .HasForeignKey(sr => sr.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(sr => sr.ProductId);
        builder.HasIndex(sr => sr.Reference);
        builder.HasIndex(sr => new { sr.ProductId, sr.Reference });
        builder.HasIndex(sr => new { sr.IsReleased, sr.IsDeleted });

        // Soft delete filter
        builder.HasQueryFilter(sr => !sr.IsDeleted);

        // Table name
        builder.ToTable("StockReservations");
    }
}

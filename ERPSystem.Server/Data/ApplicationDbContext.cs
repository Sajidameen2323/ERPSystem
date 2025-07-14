using Microsoft.EntityFrameworkCore;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Inventory Management DbSets
    public DbSet<Product> Products { get; set; }
    public DbSet<StockAdjustment> StockAdjustments { get; set; }
    
    // Supply Chain Management DbSets
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<ProductSupplier> ProductSuppliers { get; set; }
    public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
    public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
    public DbSet<StockMovement> StockMovements { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        ConfigureInventoryEntities(builder);
        ConfigureSupplyChainEntities(builder);
    }

    private void ConfigureInventoryEntities(ModelBuilder builder)
    {
        // Product Configuration
        builder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.SKU)
                .IsRequired()
                .HasMaxLength(50);

            entity.HasIndex(e => e.SKU)
                .IsUnique()
                .HasDatabaseName("IX_Product_SKU");

            entity.Property(e => e.Description)
                .HasMaxLength(1000);

            entity.Property(e => e.UnitPrice)
                .HasPrecision(18, 2);

            entity.Property(e => e.CostPrice)
                .HasPrecision(18, 2);

            entity.Property(e => e.CurrentStock)
                .HasDefaultValue(0);

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Configure soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // StockAdjustment Configuration
        builder.Entity<StockAdjustment>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Reason)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.AdjustedByUserId)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.AdjustedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Configure relationship
            entity.HasOne(e => e.Product)
                .WithMany(p => p.StockAdjustments)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.ProductId)
                .HasDatabaseName("IX_StockAdjustment_ProductId");

            entity.HasIndex(e => e.AdjustedAt)
                .HasDatabaseName("IX_StockAdjustment_AdjustedAt");
        });

        // StockMovement Configuration
        builder.Entity<StockMovement>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Reason)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.MovedByUserId)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.MovementDate)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.Reference)
                .HasMaxLength(255);

            entity.Property(e => e.Notes)
                .HasMaxLength(1000);

            // Configure relationship
            entity.HasOne(e => e.Product)
                .WithMany(p => p.StockMovements)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.ProductId)
                .HasDatabaseName("IX_StockMovement_ProductId");

            entity.HasIndex(e => e.MovementDate)
                .HasDatabaseName("IX_StockMovement_MovementDate");

            entity.HasIndex(e => e.MovementType)
                .HasDatabaseName("IX_StockMovement_MovementType");
        });
    }

    private void ConfigureSupplyChainEntities(ModelBuilder builder)
    {
        // Supplier Configuration
        builder.Entity<Supplier>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.ContactPerson)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(255);

            entity.HasIndex(e => e.Email)
                .IsUnique()
                .HasDatabaseName("IX_Supplier_Email");

            entity.Property(e => e.Phone)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(e => e.Address)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.City)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Country)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.PostalCode)
                .HasMaxLength(20);

            entity.Property(e => e.VatNumber)
                .HasMaxLength(50);

            entity.Property(e => e.SupplierCode)
                .HasMaxLength(20);

            entity.Property(e => e.PaymentTerms)
                .HasMaxLength(100);

            entity.Property(e => e.CreditLimit)
                .HasPrecision(18, 2);

            entity.Property(e => e.TotalPurchases)
                .HasPrecision(18, 2)
                .HasDefaultValue(0);

            entity.Property(e => e.PerformanceRating)
                .HasDefaultValue(0);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Configure soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // ProductSupplier Configuration
        builder.Entity<ProductSupplier>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.SupplierSKU)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.SupplierPrice)
                .HasPrecision(18, 2);

            entity.Property(e => e.MinimumOrderQuantity)
                .HasDefaultValue(1);

            entity.Property(e => e.LeadTimeDays)
                .HasDefaultValue(0);

            entity.Property(e => e.IsPreferredSupplier)
                .HasDefaultValue(false);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Configure relationships
            entity.HasOne(e => e.Product)
                .WithMany(p => p.ProductSuppliers)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Supplier)
                .WithMany(s => s.ProductSuppliers)
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.Cascade);

            // Composite index for product-supplier relationship
            entity.HasIndex(e => new { e.ProductId, e.SupplierId })
                .HasDatabaseName("IX_ProductSupplier_ProductId_SupplierId");

            entity.HasIndex(e => e.SupplierSKU)
                .HasDatabaseName("IX_ProductSupplier_SupplierSKU");

            // Apply same soft delete filter as Product
            entity.HasQueryFilter(e => e.IsActive);
        });

        // PurchaseOrder Configuration
        builder.Entity<PurchaseOrder>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.PONumber)
                .IsRequired()
                .HasMaxLength(50);

            entity.HasIndex(e => e.PONumber)
                .IsUnique()
                .HasDatabaseName("IX_PurchaseOrder_PONumber");

            entity.Property(e => e.Status)
                .HasDefaultValue(PurchaseOrderStatus.Draft);

            entity.Property(e => e.OrderDate)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.TotalAmount)
                .HasPrecision(18, 2);

            entity.Property(e => e.Notes)
                .HasMaxLength(1000);

            entity.Property(e => e.CreatedByUserId)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.ApprovedByUserId)
                .HasMaxLength(255);

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Configure relationship
            entity.HasOne(e => e.Supplier)
                .WithMany(s => s.PurchaseOrders)
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.SupplierId)
                .HasDatabaseName("IX_PurchaseOrder_SupplierId");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("IX_PurchaseOrder_Status");

            entity.HasIndex(e => e.OrderDate)
                .HasDatabaseName("IX_PurchaseOrder_OrderDate");

            // Configure soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // PurchaseOrderItem Configuration
        builder.Entity<PurchaseOrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.OrderedQuantity)
                .IsRequired();

            entity.Property(e => e.ReceivedQuantity)
                .HasDefaultValue(0);

            entity.Property(e => e.UnitPrice)
                .HasPrecision(18, 2);

            entity.Property(e => e.Notes)
                .HasMaxLength(500);

            // Configure relationships
            entity.HasOne(e => e.PurchaseOrder)
                .WithMany(po => po.Items)
                .HasForeignKey(e => e.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Product)
                .WithMany(p => p.PurchaseOrderItems)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.PurchaseOrderId)
                .HasDatabaseName("IX_PurchaseOrderItem_PurchaseOrderId");

            entity.HasIndex(e => e.ProductId)
                .HasDatabaseName("IX_PurchaseOrderItem_ProductId");
        });
    }
}

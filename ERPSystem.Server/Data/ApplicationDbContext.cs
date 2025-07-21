using Microsoft.EntityFrameworkCore;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    #region DbSets

    // Inventory Management
    public DbSet<Product> Products { get; set; }
    public DbSet<StockAdjustment> StockAdjustments { get; set; }
    public DbSet<StockMovement> StockMovements { get; set; }
    
    // Supply Chain Management
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<ProductSupplier> ProductSuppliers { get; set; }
    public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
    public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
    public DbSet<PurchaseOrderReturn> PurchaseOrderReturns { get; set; }
    public DbSet<PurchaseOrderReturnItem> PurchaseOrderReturnItems { get; set; }

    #endregion

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        ConfigureInventoryEntities(builder);
        ConfigureSupplyChainEntities(builder);
    }

    #region Inventory Entity Configuration

    private void ConfigureInventoryEntities(ModelBuilder builder)
    {
        ConfigureProduct(builder);
        ConfigureStockAdjustment(builder);
        ConfigureStockMovement(builder);
    }

    private void ConfigureProduct(ModelBuilder builder)
    {
        builder.Entity<Product>(entity =>
        {
            // Primary Key
            entity.HasKey(e => e.Id);
            
            // Required Fields
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.SKU)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Description)
                .HasMaxLength(1000);

            // Financial Properties
            entity.Property(e => e.UnitPrice)
                .HasPrecision(18, 2);

            entity.Property(e => e.CostPrice)
                .HasPrecision(18, 2);

            // Stock Properties
            entity.Property(e => e.CurrentStock)
                .HasDefaultValue(0);

            // Audit Properties
            ConfigureAuditProperties(entity);

            // Indexes
            entity.HasIndex(e => e.SKU)
                .IsUnique()
                .HasDatabaseName("IX_Product_SKU");

            // Soft Delete Filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });
    }

    private void ConfigureStockAdjustment(ModelBuilder builder)
    {
        builder.Entity<StockAdjustment>(entity =>
        {
            // Primary Key
            entity.HasKey(e => e.Id);

            // Required Fields
            entity.Property(e => e.Reason)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.AdjustedByUserId)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.AdjustedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Audit Properties
            ConfigureAuditProperties(entity);

            // Relationships
            entity.HasOne(e => e.Product)
                .WithMany(p => p.StockAdjustments)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.ProductId)
                .HasDatabaseName("IX_StockAdjustment_ProductId");

            entity.HasIndex(e => e.AdjustedAt)
                .HasDatabaseName("IX_StockAdjustment_AdjustedAt");

            // Soft Delete Filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });
    }

    private void ConfigureStockMovement(ModelBuilder builder)
    {
        builder.Entity<StockMovement>(entity =>
        {
            // Primary Key
            entity.HasKey(e => e.Id);

            // Required Fields
            entity.Property(e => e.Reason)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.MovedByUserId)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.MovementDate)
                .HasDefaultValueSql("GETUTCDATE()");

            // Optional Fields
            entity.Property(e => e.Reference)
                .HasMaxLength(255);

            entity.Property(e => e.Notes)
                .HasMaxLength(1000);

            // Audit Properties
            ConfigureAuditProperties(entity);

            // Relationships
            entity.HasOne(e => e.Product)
                .WithMany(p => p.StockMovements)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.ProductId)
                .HasDatabaseName("IX_StockMovement_ProductId");

            entity.HasIndex(e => e.MovementDate)
                .HasDatabaseName("IX_StockMovement_MovementDate");

            entity.HasIndex(e => e.MovementType)
                .HasDatabaseName("IX_StockMovement_MovementType");

            // Soft Delete Filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });
    }

    #endregion

    #region Supply Chain Entity Configuration

    private void ConfigureSupplyChainEntities(ModelBuilder builder)
    {
        ConfigureSupplier(builder);
        ConfigureProductSupplier(builder);
        ConfigurePurchaseOrder(builder);
        ConfigurePurchaseOrderItem(builder);
        ConfigurePurchaseOrderReturn(builder);
        ConfigurePurchaseOrderReturnItem(builder);
    }

    private void ConfigureSupplier(ModelBuilder builder)
    {
        builder.Entity<Supplier>(entity =>
        {
            // Primary Key
            entity.HasKey(e => e.Id);

            // Required Fields
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.ContactPerson)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(255);

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

            // Optional Fields
            entity.Property(e => e.PostalCode)
                .HasMaxLength(20);

            entity.Property(e => e.VatNumber)
                .HasMaxLength(50);

            entity.Property(e => e.SupplierCode)
                .HasMaxLength(20);

            entity.Property(e => e.PaymentTerms)
                .HasMaxLength(100);

            // Financial Properties
            entity.Property(e => e.CreditLimit)
                .HasPrecision(18, 2);

            entity.Property(e => e.TotalPurchases)
                .HasPrecision(18, 2)
                .HasDefaultValue(0);

            // Status Properties
            entity.Property(e => e.PerformanceRating)
                .HasDefaultValue(0);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            // Audit Properties
            ConfigureAuditProperties(entity);

            // Indexes
            entity.HasIndex(e => e.Email)
                .IsUnique()
                .HasDatabaseName("IX_Supplier_Email");

            // Soft Delete Filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });
    }

    private void ConfigureProductSupplier(ModelBuilder builder)
    {
        builder.Entity<ProductSupplier>(entity =>
        {
            // Primary Key
            entity.HasKey(e => e.Id);

            // Required Fields
            entity.Property(e => e.SupplierSKU)
                .IsRequired()
                .HasMaxLength(50);

            // Financial Properties
            entity.Property(e => e.SupplierPrice)
                .HasPrecision(18, 2);

            // Business Properties
            entity.Property(e => e.MinimumOrderQuantity)
                .HasDefaultValue(1);

            entity.Property(e => e.LeadTimeDays)
                .HasDefaultValue(0);

            entity.Property(e => e.IsPreferredSupplier)
                .HasDefaultValue(false);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            // Audit Properties
            ConfigureAuditProperties(entity);

            // Relationships
            entity.HasOne(e => e.Product)
                .WithMany(p => p.ProductSuppliers)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Supplier)
                .WithMany(s => s.ProductSuppliers)
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => new { e.ProductId, e.SupplierId })
                .HasDatabaseName("IX_ProductSupplier_ProductId_SupplierId");

            entity.HasIndex(e => e.SupplierSKU)
                .HasDatabaseName("IX_ProductSupplier_SupplierSKU");

            // Soft Delete Filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });
    }

    private void ConfigurePurchaseOrder(ModelBuilder builder)
    {
        builder.Entity<PurchaseOrder>(entity =>
        {
            // Primary Key
            entity.HasKey(e => e.Id);

            // Required Fields
            entity.Property(e => e.PONumber)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.CreatedByUserId)
                .IsRequired()
                .HasMaxLength(255);

            // Optional Fields
            entity.Property(e => e.ApprovedByUserId)
                .HasMaxLength(255);

            entity.Property(e => e.Notes)
                .HasMaxLength(1000);

            // Business Properties
            entity.Property(e => e.Status)
                .HasDefaultValue(PurchaseOrderStatus.Draft);

            entity.Property(e => e.OrderDate)
                .HasDefaultValueSql("GETUTCDATE()");

            // Financial Properties
            entity.Property(e => e.TotalAmount)
                .HasPrecision(18, 2);

            // Audit Properties
            ConfigureAuditProperties(entity);

            // Relationships
            entity.HasOne(e => e.Supplier)
                .WithMany(s => s.PurchaseOrders)
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.PONumber)
                .IsUnique()
                .HasDatabaseName("IX_PurchaseOrder_PONumber");

            entity.HasIndex(e => e.SupplierId)
                .HasDatabaseName("IX_PurchaseOrder_SupplierId");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("IX_PurchaseOrder_Status");

            entity.HasIndex(e => e.OrderDate)
                .HasDatabaseName("IX_PurchaseOrder_OrderDate");

            // Soft Delete Filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });
    }

    private void ConfigurePurchaseOrderItem(ModelBuilder builder)
    {
        builder.Entity<PurchaseOrderItem>(entity =>
        {
            // Primary Key
            entity.HasKey(e => e.Id);

            // Required Fields
            entity.Property(e => e.OrderedQuantity)
                .IsRequired();

            // Business Properties
            entity.Property(e => e.ReceivedQuantity)
                .HasDefaultValue(0);

            // Financial Properties
            entity.Property(e => e.UnitPrice)
                .HasPrecision(18, 2);

            // Optional Fields
            entity.Property(e => e.Notes)
                .HasMaxLength(500);

            // Audit Properties
            ConfigureAuditProperties(entity);

            // Relationships
            entity.HasOne(e => e.PurchaseOrder)
                .WithMany(po => po.Items)
                .HasForeignKey(e => e.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Product)
                .WithMany(p => p.PurchaseOrderItems)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.PurchaseOrderId)
                .HasDatabaseName("IX_PurchaseOrderItem_PurchaseOrderId");

            entity.HasIndex(e => e.ProductId)
                .HasDatabaseName("IX_PurchaseOrderItem_ProductId");

            // Soft Delete Filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });
    }

    private void ConfigurePurchaseOrderReturn(ModelBuilder builder)
    {
        builder.Entity<PurchaseOrderReturn>(entity =>
        {
            // Primary Key
            entity.HasKey(e => e.Id);

            // Required Fields
            entity.Property(e => e.ReturnNumber)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.CreatedByUserId)
                .IsRequired();

            entity.Property(e => e.TotalReturnAmount)
                .HasColumnType("decimal(18,2)");

            // Indexes
            entity.HasIndex(e => e.ReturnNumber)
                .IsUnique()
                .HasDatabaseName("IX_PurchaseOrderReturn_ReturnNumber");

            entity.HasIndex(e => e.PurchaseOrderId)
                .HasDatabaseName("IX_PurchaseOrderReturn_PurchaseOrderId");

            entity.HasIndex(e => e.SupplierId)
                .HasDatabaseName("IX_PurchaseOrderReturn_SupplierId");

            entity.HasIndex(e => e.ReturnDate)
                .HasDatabaseName("IX_PurchaseOrderReturn_ReturnDate");

            // Relationships
            entity.HasOne(e => e.PurchaseOrder)
                .WithMany()
                .HasForeignKey(e => e.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Supplier)
                .WithMany()
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Items)
                .WithOne(e => e.PurchaseOrderReturn)
                .HasForeignKey(e => e.PurchaseOrderReturnId)
                .OnDelete(DeleteBehavior.Cascade);

            // Soft Delete Filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });
    }

    private void ConfigurePurchaseOrderReturnItem(ModelBuilder builder)
    {
        builder.Entity<PurchaseOrderReturnItem>(entity =>
        {
            // Primary Key
            entity.HasKey(e => e.Id);

            // Required Fields
            entity.Property(e => e.ReturnQuantity)
                .IsRequired();

            entity.Property(e => e.UnitPrice)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            entity.Property(e => e.TotalReturnAmount)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            // Indexes
            entity.HasIndex(e => e.PurchaseOrderReturnId)
                .HasDatabaseName("IX_PurchaseOrderReturnItem_PurchaseOrderReturnId");

            entity.HasIndex(e => e.ProductId)
                .HasDatabaseName("IX_PurchaseOrderReturnItem_ProductId");

            entity.HasIndex(e => e.PurchaseOrderItemId)
                .HasDatabaseName("IX_PurchaseOrderReturnItem_PurchaseOrderItemId");

            // Relationships
            entity.HasOne(e => e.PurchaseOrderReturn)
                .WithMany(e => e.Items)
                .HasForeignKey(e => e.PurchaseOrderReturnId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PurchaseOrderItem)
                .WithMany()
                .HasForeignKey(e => e.PurchaseOrderItemId)
                .OnDelete(DeleteBehavior.Restrict);

            // Soft Delete Filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Configures standard audit properties for entities with soft delete support
    /// </summary>
    private static void ConfigureAuditProperties<T>(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<T> entity) 
        where T : class
    {
        entity.Property("IsDeleted")
            .HasDefaultValue(false);

        entity.Property("CreatedAt")
            .HasDefaultValueSql("GETUTCDATE()");

        entity.Property("UpdatedAt")
            .HasDefaultValueSql("GETUTCDATE()");
    }

    #endregion
}

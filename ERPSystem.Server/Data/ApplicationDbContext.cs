using Microsoft.EntityFrameworkCore;
using ERPSystem.Server.Models;
using ERPSystem.Server.Data.Configurations;

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
    public DbSet<StockReservation> StockReservations { get; set; }
    
    // Supply Chain Management
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<ProductSupplier> ProductSuppliers { get; set; }
    public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
    public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
    public DbSet<PurchaseOrderReturn> PurchaseOrderReturns { get; set; }
    public DbSet<PurchaseOrderReturnItem> PurchaseOrderReturnItems { get; set; }

    // Sales Management
    public DbSet<Customer> Customers { get; set; }
    public DbSet<SalesOrder> SalesOrders { get; set; }
    public DbSet<SalesOrderItem> SalesOrderItems { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<InvoiceItem> InvoiceItems { get; set; }

    #endregion

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Apply all entity configurations using extension method
        builder.ApplyAllConfigurations();
    }
}

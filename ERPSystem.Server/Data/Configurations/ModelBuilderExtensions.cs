using Microsoft.EntityFrameworkCore;
using ERPSystem.Server.Data.Configurations.Inventory;
using ERPSystem.Server.Data.Configurations.SupplyChain;
using ERPSystem.Server.Data.Configurations.Sales;

namespace ERPSystem.Server.Data.Configurations;

/// <summary>
/// Extension methods for applying entity configurations
/// </summary>
public static class ModelBuilderExtensions
{
    /// <summary>
    /// Applies all entity configurations to the ModelBuilder
    /// </summary>
    /// <param name="modelBuilder">The ModelBuilder instance</param>
    /// <returns>The ModelBuilder instance for method chaining</returns>
    public static ModelBuilder ApplyAllConfigurations(this ModelBuilder modelBuilder)
    {
        // Apply Inventory configurations
        modelBuilder.ApplyInventoryConfigurations();
        
        // Apply Supply Chain configurations
        modelBuilder.ApplySupplyChainConfigurations();
        
        // Apply Sales configurations
        modelBuilder.ApplySalesConfigurations();

        return modelBuilder;
    }

    /// <summary>
    /// Applies inventory-related entity configurations
    /// </summary>
    private static ModelBuilder ApplyInventoryConfigurations(this ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new ProductConfiguration());
        modelBuilder.ApplyConfiguration(new StockAdjustmentConfiguration());
        modelBuilder.ApplyConfiguration(new StockMovementConfiguration());

        return modelBuilder;
    }

    /// <summary>
    /// Applies supply chain-related entity configurations
    /// </summary>
    private static ModelBuilder ApplySupplyChainConfigurations(this ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new SupplierConfiguration());
        modelBuilder.ApplyConfiguration(new ProductSupplierConfiguration());
        modelBuilder.ApplyConfiguration(new PurchaseOrderConfiguration());
        modelBuilder.ApplyConfiguration(new PurchaseOrderItemConfiguration());
        modelBuilder.ApplyConfiguration(new PurchaseOrderReturnConfiguration());
        modelBuilder.ApplyConfiguration(new PurchaseOrderReturnItemConfiguration());

        return modelBuilder;
    }

    /// <summary>
    /// Applies sales-related entity configurations
    /// </summary>
    private static ModelBuilder ApplySalesConfigurations(this ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new CustomerConfiguration());
        modelBuilder.ApplyConfiguration(new SalesOrderConfiguration());
        modelBuilder.ApplyConfiguration(new SalesOrderItemConfiguration());

        return modelBuilder;
    }
}

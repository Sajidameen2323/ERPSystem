using Microsoft.EntityFrameworkCore;
using ERPSystem.Server.Data;
using ERPSystem.Server.Models;
using ERPSystem.Server.Services.Interfaces;

namespace ERPSystem.Server.Services.Implementations;

/// <summary>
/// Service for handling soft delete operations following industry standards
/// </summary>
public class SoftDeleteService : ISoftDeleteService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SoftDeleteService> _logger;

    public SoftDeleteService(ApplicationDbContext context, ILogger<SoftDeleteService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<SoftDeleteResult> SafeDeleteAsync<T>(Guid id) where T : class
    {
        try
        {
            var entity = await _context.Set<T>().FindAsync(id);
            if (entity == null)
            {
                return new SoftDeleteResult
                {
                    Success = false,
                    Message = $"{typeof(T).Name} not found",
                    DeleteType = SoftDeleteType.Failed
                };
            }

            var hasDependents = await HasDependentRecordsAsync<T>(id);

            if (hasDependents)
            {
                // Perform soft delete
                SetSoftDeleteProperties(entity, true);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Soft deleted {EntityType} with ID: {EntityId}", typeof(T).Name, id);
                return new SoftDeleteResult
                {
                    Success = true,
                    Message = $"{typeof(T).Name} soft deleted successfully",
                    DeleteType = SoftDeleteType.SoftDelete
                };
            }
            else
            {
                // Perform hard delete
                _context.Set<T>().Remove(entity);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Hard deleted {EntityType} with ID: {EntityId}", typeof(T).Name, id);
                return new SoftDeleteResult
                {
                    Success = true,
                    Message = $"{typeof(T).Name} hard deleted successfully",
                    DeleteType = SoftDeleteType.HardDelete
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting {EntityType} with ID: {EntityId}", typeof(T).Name, id);
            return new SoftDeleteResult
            {
                Success = false,
                Message = $"Error deleting {typeof(T).Name}",
                DeleteType = SoftDeleteType.Failed
            };
        }
    }

    public async Task<bool> RestoreAsync<T>(Guid id) where T : class
    {
        try
        {
            var entity = await _context.Set<T>()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => EF.Property<Guid>(e, "Id") == id && EF.Property<bool>(e, "IsDeleted"));

            if (entity == null)
            {
                return false;
            }

            SetSoftDeleteProperties(entity, false);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Restored {EntityType} with ID: {EntityId}", typeof(T).Name, id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring {EntityType} with ID: {EntityId}", typeof(T).Name, id);
            return false;
        }
    }

    public async Task<bool> HasDependentRecordsAsync<T>(Guid id) where T : class
    {
        try
        {
            return typeof(T).Name switch
            {
                nameof(Customer) => await _context.SalesOrders.AnyAsync(so => so.CustomerId == id),
                nameof(Product) => await HasProductDependentsAsync(id),
                nameof(Supplier) => await HasSupplierDependentsAsync(id),
                nameof(SalesOrder) => await _context.SalesOrderItems.AnyAsync(oi => oi.SalesOrderId == id),
                nameof(PurchaseOrder) => await HasPurchaseOrderDependentsAsync(id),
                _ => false
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking dependents for {EntityType} with ID: {EntityId}", typeof(T).Name, id);
            return true; // Default to safe side (soft delete)
        }
    }

    public async Task<List<T>> GetSoftDeletedAsync<T>() where T : class
    {
        try
        {
            return await _context.Set<T>()
                .IgnoreQueryFilters()
                .Where(e => EF.Property<bool>(e, "IsDeleted"))
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving soft deleted {EntityType}", typeof(T).Name);
            return new List<T>();
        }
    }

    #region Private Helper Methods

    private void SetSoftDeleteProperties<T>(T entity, bool isDeleted) where T : class
    {
        var isDeletedProperty = typeof(T).GetProperty("IsDeleted");
        var updatedAtProperty = typeof(T).GetProperty("UpdatedAt");

        if (isDeletedProperty != null)
        {
            isDeletedProperty.SetValue(entity, isDeleted);
        }

        if (updatedAtProperty != null)
        {
            updatedAtProperty.SetValue(entity, DateTime.UtcNow);
        }
    }

    private async Task<bool> HasProductDependentsAsync(Guid productId)
    {
        return await _context.PurchaseOrderItems.AnyAsync(poi => poi.ProductId == productId) ||
               await _context.SalesOrderItems.AnyAsync(oi => oi.ProductId == productId) ||
               await _context.StockAdjustments.AnyAsync(sa => sa.ProductId == productId) ||
               await _context.StockMovements.AnyAsync(sm => sm.ProductId == productId) ||
               await _context.ProductSuppliers.AnyAsync(ps => ps.ProductId == productId);
    }

    private async Task<bool> HasSupplierDependentsAsync(Guid supplierId)
    {
        return await _context.PurchaseOrders.AnyAsync(po => po.SupplierId == supplierId) ||
               await _context.ProductSuppliers.AnyAsync(ps => ps.SupplierId == supplierId) ||
               await _context.PurchaseOrderReturns.AnyAsync(por => por.SupplierId == supplierId);
    }

    private async Task<bool> HasPurchaseOrderDependentsAsync(Guid purchaseOrderId)
    {
        return await _context.PurchaseOrderItems.AnyAsync(poi => poi.PurchaseOrderId == purchaseOrderId) ||
               await _context.PurchaseOrderReturns.AnyAsync(por => por.PurchaseOrderId == purchaseOrderId);
    }

    #endregion
}

using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.SupplyChain;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Services.Interfaces;

public interface ISupplierService
{
    Task<Result<PagedResult<SupplierDto>>> GetSuppliersAsync(
        string? searchTerm = null,
        bool? isActive = null,
        int page = 1,
        int pageSize = 10,
        string? sortBy = null,
        string? sortDirection = "asc");
    
    Task<Result<SupplierDto>> GetSupplierByIdAsync(Guid id);
    Task<Result<SupplierDto>> CreateSupplierAsync(SupplierCreateDto dto);
    Task<Result<SupplierDto>> UpdateSupplierAsync(Guid id, SupplierUpdateDto dto);
    Task<Result<bool>> DeleteSupplierAsync(Guid id);
    Task<Result<bool>> ActivateSupplierAsync(Guid id);
    Task<Result<bool>> DeactivateSupplierAsync(Guid id);
    
    // Product-Supplier relationships
    Task<Result<PagedResult<ProductSupplierDto>>> GetProductSuppliersAsync(
        Guid? productId = null,
        Guid? supplierId = null,
        int page = 1,
        int pageSize = 10);
    
    Task<Result<ProductSupplierDto>> CreateProductSupplierAsync(ProductSupplierCreateDto dto);
    Task<Result<ProductSupplierDto>> UpdateProductSupplierAsync(Guid id, ProductSupplierUpdateDto dto);
    Task<Result<bool>> DeleteProductSupplierAsync(Guid id);
}

public interface IPurchaseOrderService
{
    Task<Result<PagedResult<PurchaseOrderDto>>> GetPurchaseOrdersAsync(
        Guid? supplierId = null,
        PurchaseOrderStatus? status = null,
        string? searchTerm = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 10,
        string? sortBy = null,
        string? sortDirection = "asc");
    
    Task<Result<PurchaseOrderDto>> GetPurchaseOrderByIdAsync(Guid id);
    Task<Result<PurchaseOrderDto>> CreatePurchaseOrderAsync(PurchaseOrderCreateDto dto, string userId);
    Task<Result<PurchaseOrderDto>> UpdatePurchaseOrderAsync(Guid id, PurchaseOrderUpdateDto dto);
    Task<Result<bool>> DeletePurchaseOrderAsync(Guid id);
    
    // Status management
    Task<Result<bool>> ApprovePurchaseOrderAsync(Guid id, string approvedByUserId);
    Task<Result<bool>> SendPurchaseOrderAsync(Guid id);
    Task<Result<bool>> CancelPurchaseOrderAsync(Guid id, string reason);
    
    // Receiving items
    Task<Result<bool>> ReceiveItemAsync(Guid purchaseOrderItemId, ReceiveItemDto dto, string receivedByUserId);
    Task<Result<bool>> ReceiveFullOrderAsync(Guid purchaseOrderId, string receivedByUserId);
    
    // Stock movement tracking
    Task<Result<PagedResult<StockMovementDto>>> GetStockMovementsAsync(
        Guid? productId = null,
        StockMovementType? movementType = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 10);
    
    Task<Result<StockMovementDto>> CreateStockMovementAsync(StockMovementCreateDto dto, string userId);
}

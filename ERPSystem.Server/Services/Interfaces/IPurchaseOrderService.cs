using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.SupplyChain;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Services.Interfaces;

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
    Task<Result<bool>> MarkPurchaseOrderPendingAsync(Guid id);
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

    // Financial metrics
    Task<(decimal TotalPurchaseValue, decimal TotalPurchasePaid, decimal TotalPurchaseOutstanding)> GetFinancialDataAsync(
        DateTime? fromDate = null, 
        DateTime? toDate = null);
}

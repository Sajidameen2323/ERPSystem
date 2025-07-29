using ERPSystem.Server.Common;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Services.Interfaces;

public interface IStockMovementService
{
    Task<Result<bool>> ProcessStockMovementAsync(Guid productId, int quantity, StockMovementType movementType, 
        string reference, string reason, string movedByUserId, string? notes = null, bool useExistingTransaction = false);
    Task<Result<bool>> ValidateStockAvailabilityAsync(List<(Guid ProductId, int Quantity)> items);
    Task<Result<bool>> ValidateAvailableStockAsync(List<(Guid ProductId, int Quantity)> items); // Available = Current - Reserved
    Task<Result<bool>> ValidateAvailableStockForUpdateAsync(List<(Guid ProductId, int Quantity)> items, string salesOrderReferenceNumber); // Calculate available stock for order update by adding back order's reserved stock
    Task<Result<bool>> ReserveStockAsync(List<(Guid ProductId, int Quantity)> items, Guid salesOrderId, string reference, string userId, string? reason = null, bool useExistingTransaction = false);
    Task<Result<bool>> ReleaseStockReservationAsync(List<(Guid ProductId, int Quantity)> items, string reference, bool useExistingTransaction = false);
    Task<Result<bool>> ReleaseAllStockReservationsByReferenceAsync(string reference, bool useExistingTransaction = false);
    Task<Result<int>> GetReservedStockAsync(Guid productId);
    Task<Result<int>> GetAvailableStockAsync(Guid productId); // Current - Reserved
}

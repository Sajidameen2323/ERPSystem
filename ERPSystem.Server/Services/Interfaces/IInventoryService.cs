using ERPSystem.Server.Common;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Services.Interfaces;

public interface IInvoiceService
{
    Task<Result<bool>> CreateInvoiceFromSalesOrderAsync(Guid salesOrderId, string generatedByUserId);
    Task<Result<string>> GenerateInvoiceNumberAsync();
}

public interface IStockMovementService
{
    Task<Result<bool>> ProcessStockMovementAsync(Guid productId, int quantity, StockMovementType movementType, 
        string reference, string reason, string movedByUserId, string? notes = null);
    Task<Result<bool>> ValidateStockAvailabilityAsync(List<(Guid ProductId, int Quantity)> items);
    Task<Result<bool>> ReserveStockAsync(List<(Guid ProductId, int Quantity)> items, string reference, string userId);
    Task<Result<bool>> ReleaseStockReservationAsync(List<(Guid ProductId, int Quantity)> items, string reference);
}

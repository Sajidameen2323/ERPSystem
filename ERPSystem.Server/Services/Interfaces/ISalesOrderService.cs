using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Sales;
using ERPSystem.Server.Models.Enums;

namespace ERPSystem.Server.Services.Interfaces;

/// <summary>
/// Interface for sales order management operations
/// </summary>
public interface ISalesOrderService
{
    /// <summary>
    /// Retrieves a paged list of sales orders based on query parameters
    /// </summary>
    Task<Result<PagedResult<SalesOrderDto>>> GetSalesOrdersAsync(SalesOrderQueryParameters parameters);

    /// <summary>
    /// Retrieves a specific sales order by ID
    /// </summary>
    Task<Result<SalesOrderDto>> GetSalesOrderByIdAsync(Guid id);

    /// <summary>
    /// Creates a new sales order
    /// </summary>
    Task<Result<SalesOrderDto>> CreateSalesOrderAsync(SalesOrderCreateDto createDto);

    /// <summary>
    /// Updates an existing sales order
    /// </summary>
    Task<Result<SalesOrderDto>> UpdateSalesOrderAsync(Guid id, SalesOrderUpdateDto updateDto);

    /// <summary>
    /// Updates the status of a sales order
    /// </summary>
    Task<Result<SalesOrderDto>> UpdateSalesOrderStatusAsync(Guid id, SalesOrderStatusUpdateDto statusUpdateDto);

    /// <summary>
    /// Soft deletes a sales order
    /// </summary>
    Task<Result<bool>> DeleteSalesOrderAsync(Guid id);

    /// <summary>
    /// Restores a soft deleted sales order
    /// </summary>
    Task<Result<bool>> RestoreSalesOrderAsync(Guid id);

    /// <summary>
    /// Gets sales orders for a specific customer
    /// </summary>
    Task<Result<PagedResult<SalesOrderDto>>> GetSalesOrdersByCustomerAsync(Guid customerId, SalesOrderQueryParameters parameters);

    /// <summary>
    /// Calculates the total amount for a sales order based on its items
    /// </summary>
    Task<Result<decimal>> CalculateOrderTotalAsync(List<SalesOrderItemCreateDto> orderItems);

    /// <summary>
    /// Validates if a sales order can be updated based on its current status
    /// </summary>
    Task<Result<bool>> CanUpdateSalesOrderAsync(Guid id);

    /// <summary>
    /// Validates if a sales order status transition is allowed
    /// </summary>
    bool IsStatusTransitionValid(SalesOrderStatus currentStatus, SalesOrderStatus newStatus);

    /// <summary>
    /// Gets sales order statistics for reporting
    /// </summary>
    Task<Result<SalesOrderStatsDto>> GetSalesOrderStatsAsync(DateTime? fromDate = null, DateTime? toDate = null);
}

/// <summary>
/// DTO for sales order statistics
/// </summary>
public class SalesOrderStatsDto
{
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public int NewOrders { get; set; }
    public int ProcessingOrders { get; set; }
    public int ShippedOrders { get; set; }
    public int CompletedOrders { get; set; }
    public int CancelledOrders { get; set; }
    public int OnHoldOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
}

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Server.Data;
using ERPSystem.Server.Models;
using ERPSystem.Server.Models.Enums;
using ERPSystem.Server.DTOs.Sales;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;

namespace ERPSystem.Server.Services.Implementations;

/// <summary>
/// Service implementation for sales order management operations with ERP functionality
/// </summary>
public class SalesOrderService : ISalesOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<SalesOrderService> _logger;
    private readonly IInvoiceService _invoiceService;
    private readonly IStockMovementService _stockMovementService;

    public SalesOrderService(
        ApplicationDbContext context, 
        IMapper mapper, 
        ILogger<SalesOrderService> logger,
        IInvoiceService invoiceService,
        IStockMovementService stockMovementService)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _invoiceService = invoiceService;
        _stockMovementService = stockMovementService;
    }

    public async Task<Result<PagedResult<SalesOrderDto>>> GetSalesOrdersAsync(SalesOrderQueryParameters parameters)
    {
        try
        {
            var query = _context.SalesOrders
                .Include(so => so.Customer)
                .Include(so => so.SalesOrderItems)
                    .ThenInclude(soi => soi.Product)
                .AsQueryable();

            // Handle soft delete filter based on parameters
            if (parameters.OnlyInactive)
            {
                query = query.IgnoreQueryFilters().Where(so => so.IsDeleted);
            }
            else if (parameters.IncludeDeleted)
            {
                query = query.IgnoreQueryFilters();
            }

            // Apply filters
            if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
            {
                var searchTerm = parameters.SearchTerm.ToLower();
                query = query.Where(so =>
                    so.Customer.Name.ToLower().Contains(searchTerm) ||
                    (so.ReferenceNumber != null && so.ReferenceNumber.ToLower().Contains(searchTerm)) ||
                    (so.OrderNotes != null && so.OrderNotes.ToLower().Contains(searchTerm)));
            }

            if (parameters.CustomerId.HasValue)
            {
                query = query.Where(so => so.CustomerId == parameters.CustomerId.Value);
            }

            if (parameters.Status.HasValue)
            {
                query = query.Where(so => so.Status == parameters.Status.Value);
            }

            if (parameters.OrderDateFrom.HasValue)
            {
                query = query.Where(so => so.OrderDate >= parameters.OrderDateFrom.Value);
            }

            if (parameters.OrderDateTo.HasValue)
            {
                query = query.Where(so => so.OrderDate <= parameters.OrderDateTo.Value);
            }

            // Apply sorting
            query = parameters.SortBy?.ToLower() switch
            {
                "customer" => parameters.SortDescending ? query.OrderByDescending(so => so.Customer.Name) : query.OrderBy(so => so.Customer.Name),
                "status" => parameters.SortDescending ? query.OrderByDescending(so => so.Status) : query.OrderBy(so => so.Status),
                "totalamount" => parameters.SortDescending ? query.OrderByDescending(so => so.TotalAmount) : query.OrderBy(so => so.TotalAmount),
                "referencenumber" => parameters.SortDescending ? query.OrderByDescending(so => so.ReferenceNumber) : query.OrderBy(so => so.ReferenceNumber),
                "createdat" => parameters.SortDescending ? query.OrderByDescending(so => so.CreatedAt) : query.OrderBy(so => so.CreatedAt),
                "updatedat" => parameters.SortDescending ? query.OrderByDescending(so => so.UpdatedAt) : query.OrderBy(so => so.UpdatedAt),
                _ => parameters.SortDescending ? query.OrderByDescending(so => so.OrderDate) : query.OrderBy(so => so.OrderDate)
            };

            var totalCount = await query.CountAsync();
            var salesOrders = await query
                .Skip((parameters.Page - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var salesOrderDtos = _mapper.Map<List<SalesOrderDto>>(salesOrders);

            var pagedResult = new PagedResult<SalesOrderDto>
            {
                Items = salesOrderDtos,
                TotalCount = totalCount,
                CurrentPage = parameters.Page,
                PageSize = parameters.PageSize
            };

            return Result<PagedResult<SalesOrderDto>>.Success(pagedResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sales orders with parameters: {@Parameters}", parameters);
            return Result<PagedResult<SalesOrderDto>>.Failure("An error occurred while retrieving sales orders");
        }
    }

    public async Task<Result<SalesOrderDto>> GetSalesOrderByIdAsync(Guid id)
    {
        try
        {
            var salesOrder = await _context.SalesOrders
                .IgnoreQueryFilters()
                .Include(so => so.Customer)
                .Include(so => so.SalesOrderItems.Where(soi => !soi.IsDeleted))
                    .ThenInclude(soi => soi.Product)
                .FirstOrDefaultAsync(so => so.Id == id);

            if (salesOrder == null)
            {
                return Result<SalesOrderDto>.Failure("Sales order not found");
            }

            var salesOrderDto = _mapper.Map<SalesOrderDto>(salesOrder);
            return Result<SalesOrderDto>.Success(salesOrderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sales order with ID: {Id}", id);
            return Result<SalesOrderDto>.Failure("An error occurred while retrieving the sales order");
        }
    }

    public async Task<Result<SalesOrderDto>> CreateSalesOrderAsync(SalesOrderCreateDto createDto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Validate customer exists
            var customerExists = await _context.Customers
                .AnyAsync(c => c.Id == createDto.CustomerId && !c.IsDeleted);
            if (!customerExists)
            {
                return Result<SalesOrderDto>.Failure("Customer not found or is inactive");
            }

            // Validate stock availability
            var stockItems = createDto.OrderItems.Select(oi => (oi.ProductId, oi.Quantity)).ToList();
            var stockValidation = await _stockMovementService.ValidateStockAvailabilityAsync(stockItems);
            if (!stockValidation.IsSuccess)
            {
                return Result<SalesOrderDto>.Failure(stockValidation.Error);
            }

            // Calculate total amount
            var totalResult = await CalculateOrderTotalAsync(createDto.OrderItems);
            if (!totalResult.IsSuccess)
            {
                return Result<SalesOrderDto>.Failure(totalResult.Error);
            }

            // Generate reference number
            var referenceNumberResult = await GenerateReferenceNumberAsync();
            if (!referenceNumberResult.IsSuccess)
            {
                return Result<SalesOrderDto>.Failure("Failed to generate reference number");
            }

            // Create sales order
            var salesOrder = new SalesOrder
            {
                Id = Guid.NewGuid(),
                CustomerId = createDto.CustomerId,
                OrderedByUserId = createDto.OrderedByUserId,
                OrderNotes = createDto.OrderNotes,
                ReferenceNumber = referenceNumberResult.Data, // Auto-generated
                TotalAmount = totalResult.Data,
                Status = SalesOrderStatus.New,
                OrderDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.SalesOrders.Add(salesOrder);
            await _context.SaveChangesAsync();

            // Create sales order items
            foreach (var itemDto in createDto.OrderItems)
            {
                var orderItem = new SalesOrderItem
                {
                    Id = Guid.NewGuid(),
                    SalesOrderId = salesOrder.Id,
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitPriceAtTimeOfOrder = itemDto.UnitPrice,
                    LineTotal = itemDto.Quantity * itemDto.UnitPrice,
                    Notes = itemDto.Notes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.SalesOrderItems.Add(orderItem);
            }

            // Reserve stock for new order
            await _stockMovementService.ReserveStockAsync(stockItems, salesOrder.ReferenceNumber ?? $"SO-{salesOrder.Id}", createDto.OrderedByUserId);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var result = await GetSalesOrderByIdAsync(salesOrder.Id);
            if (result.IsSuccess)
            {
                _logger.LogInformation("Sales order created successfully with ID: {Id}, Reference: {Reference}", 
                    salesOrder.Id, salesOrder.ReferenceNumber);
            }

            return result;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error creating sales order: {@CreateDto}", createDto);
            return Result<SalesOrderDto>.Failure("An error occurred while creating the sales order");
        }
    }

    public async Task<Result<SalesOrderDto>> UpdateSalesOrderAsync(Guid id, SalesOrderUpdateDto updateDto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var salesOrder = await _context.SalesOrders
                .Include(so => so.SalesOrderItems)
                .FirstOrDefaultAsync(so => so.Id == id && !so.IsDeleted);

            if (salesOrder == null)
            {
                return Result<SalesOrderDto>.Failure("Sales order not found");
            }

            // Check if order can be updated based on status
            var canUpdateResult = await CanUpdateSalesOrderAsync(id);
            if (!canUpdateResult.IsSuccess || !canUpdateResult.Data)
            {
                return Result<SalesOrderDto>.Failure("Sales order cannot be updated in its current status");
            }

            // Update sales order properties
            salesOrder.OrderNotes = updateDto.OrderNotes;
            salesOrder.ReferenceNumber = updateDto.ReferenceNumber;
            salesOrder.UpdatedAt = DateTime.UtcNow;

            // Update order items if provided
            if (updateDto.OrderItems != null)
            {
                // Handle existing items updates and deletions
                foreach (var existingItem in salesOrder.SalesOrderItems)
                {
                    var updateItem = updateDto.OrderItems.FirstOrDefault(ui => ui.Id == existingItem.Id);
                    if (updateItem == null)
                    {
                        // Item not in update list, mark as deleted
                        existingItem.IsDeleted = true;
                        existingItem.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        // Update existing item
                        existingItem.ProductId = updateItem.ProductId;
                        existingItem.Quantity = updateItem.Quantity;
                        existingItem.UnitPriceAtTimeOfOrder = updateItem.UnitPrice;
                        existingItem.LineTotal = updateItem.Quantity * updateItem.UnitPrice;
                        existingItem.Notes = updateItem.Notes;
                        existingItem.IsDeleted = updateItem.IsDeleted;
                        existingItem.UpdatedAt = DateTime.UtcNow;
                    }
                }

                // Handle new items
                var newItems = updateDto.OrderItems.Where(ui => !ui.Id.HasValue);
                foreach (var newItemDto in newItems)
                {
                    var newItem = new SalesOrderItem
                    {
                        Id = Guid.NewGuid(),
                        SalesOrderId = salesOrder.Id,
                        ProductId = newItemDto.ProductId,
                        Quantity = newItemDto.Quantity,
                        UnitPriceAtTimeOfOrder = newItemDto.UnitPrice,
                        LineTotal = newItemDto.Quantity * newItemDto.UnitPrice,
                        Notes = newItemDto.Notes,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.SalesOrderItems.Add(newItem);
                }

                // Recalculate total amount
                var activeItems = salesOrder.SalesOrderItems.Where(soi => !soi.IsDeleted).ToList();
                salesOrder.TotalAmount = activeItems.Sum(soi => soi.LineTotal);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var result = await GetSalesOrderByIdAsync(id);
            if (result.IsSuccess)
            {
                _logger.LogInformation("Sales order updated successfully with ID: {Id}", id);
            }

            return result;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error updating sales order with ID: {Id}", id);
            return Result<SalesOrderDto>.Failure("An error occurred while updating the sales order");
        }
    }

    public async Task<Result<SalesOrderDto>> UpdateSalesOrderStatusAsync(Guid id, SalesOrderStatusUpdateDto statusUpdateDto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var salesOrder = await _context.SalesOrders
                .Include(so => so.SalesOrderItems.Where(soi => !soi.IsDeleted))
                    .ThenInclude(soi => soi.Product)
                .FirstOrDefaultAsync(so => so.Id == id && !so.IsDeleted);

            if (salesOrder == null)
            {
                return Result<SalesOrderDto>.Failure("Sales order not found");
            }

            // Validate status transition
            if (!IsStatusTransitionValid(salesOrder.Status, statusUpdateDto.Status))
            {
                return Result<SalesOrderDto>.Failure($"Cannot change status from {salesOrder.Status} to {statusUpdateDto.Status}");
            }

            var previousStatus = salesOrder.Status;

            // Update status and related dates
            salesOrder.Status = statusUpdateDto.Status;
            salesOrder.UpdatedAt = DateTime.UtcNow;

            if (statusUpdateDto.ShippedDate.HasValue)
            {
                salesOrder.ShippedDate = statusUpdateDto.ShippedDate.Value;
            }

            if (statusUpdateDto.DeliveredDate.HasValue)
            {
                salesOrder.DeliveredDate = statusUpdateDto.DeliveredDate.Value;
            }

            // ERP Business Logic: Handle status-specific operations
            switch (statusUpdateDto.Status)
            {
                case SalesOrderStatus.Processing:
                    // When moving to processing, validate stock and create invoice
                    if (previousStatus == SalesOrderStatus.New)
                    {
                        var stockItems = salesOrder.SalesOrderItems.Select(soi => (soi.ProductId, soi.Quantity)).ToList();
                        var stockValidation = await _stockMovementService.ValidateStockAvailabilityAsync(stockItems);
                        if (!stockValidation.IsSuccess)
                        {
                            await transaction.RollbackAsync();
                            return Result<SalesOrderDto>.Failure($"Cannot process order: {stockValidation.Error}");
                        }

                        // Create invoice for processing orders
                        var invoiceResult = await _invoiceService.CreateInvoiceFromSalesOrderAsync(id, statusUpdateDto.UpdatedByUserId ?? "System");
                        if (!invoiceResult.IsSuccess)
                        {
                            _logger.LogWarning("Failed to create invoice for sales order {Id}: {Error}", id, invoiceResult.Error);
                        }
                    }
                    break;

                case SalesOrderStatus.Shipped:
                    if (!salesOrder.ShippedDate.HasValue)
                        salesOrder.ShippedDate = DateTime.UtcNow;

                    // Process stock movements when order is shipped
                    foreach (var item in salesOrder.SalesOrderItems.Where(soi => !soi.IsDeleted))
                    {
                        var stockResult = await _stockMovementService.ProcessStockMovementAsync(
                            item.ProductId,
                            item.Quantity,
                            StockMovementType.StockOut,
                            salesOrder.ReferenceNumber,
                            $"Sales Order Shipped - {salesOrder.ReferenceNumber}",
                            statusUpdateDto.UpdatedByUserId ?? "System",
                            $"Stock deducted for shipped sales order"
                        );

                        if (!stockResult.IsSuccess)
                        {
                            await transaction.RollbackAsync();
                            return Result<SalesOrderDto>.Failure($"Failed to process stock movement: {stockResult.Error}");
                        }
                    }
                    break;

                case SalesOrderStatus.Completed:
                    if (!salesOrder.DeliveredDate.HasValue)
                        salesOrder.DeliveredDate = DateTime.UtcNow;
                    // Order completed - no additional stock movements needed
                    break;

                case SalesOrderStatus.Cancelled:
                    // Release any stock reservations
                    var cancelledItems = salesOrder.SalesOrderItems.Select(soi => (soi.ProductId, soi.Quantity)).ToList();
                    await _stockMovementService.ReleaseStockReservationAsync(cancelledItems, salesOrder.ReferenceNumber ?? $"SO-{id}");
                    break;

                case SalesOrderStatus.Returned:
                    // Return stock to inventory
                    foreach (var item in salesOrder.SalesOrderItems.Where(soi => !soi.IsDeleted))
                    {
                        var returnResult = await _stockMovementService.ProcessStockMovementAsync(
                            item.ProductId,
                            item.Quantity,
                            StockMovementType.Return,
                            salesOrder.ReferenceNumber,
                            $"Sales Order Returned - {salesOrder.ReferenceNumber}",
                            statusUpdateDto.UpdatedByUserId ?? "System",
                            "Stock returned from customer"
                        );

                        if (!returnResult.IsSuccess)
                        {
                            _logger.LogWarning("Failed to process return stock movement for item {ProductId}: {Error}", 
                                item.ProductId, returnResult.Error);
                        }
                    }
                    break;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var result = await GetSalesOrderByIdAsync(id);
            if (result.IsSuccess)
            {
                _logger.LogInformation("Sales order status updated successfully. ID: {Id}, Previous Status: {PreviousStatus}, New Status: {NewStatus}", 
                    id, previousStatus, statusUpdateDto.Status);
            }

            return result;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error updating sales order status. ID: {Id}", id);
            return Result<SalesOrderDto>.Failure("An error occurred while updating the sales order status");
        }
    }

    public async Task<Result<bool>> DeleteSalesOrderAsync(Guid id)
    {
        try
        {
            var salesOrder = await _context.SalesOrders
                .Include(so => so.SalesOrderItems)
                .FirstOrDefaultAsync(so => so.Id == id && !so.IsDeleted);

            if (salesOrder == null)
            {
                return Result<bool>.Failure("Sales order not found");
            }

            // Check if order can be deleted based on status
            if (salesOrder.Status == SalesOrderStatus.Shipped || salesOrder.Status == SalesOrderStatus.Completed)
            {
                return Result<bool>.Failure("Cannot delete shipped or completed orders");
            }

            // Soft delete the sales order and its items
            salesOrder.IsDeleted = true;
            salesOrder.UpdatedAt = DateTime.UtcNow;

            foreach (var item in salesOrder.SalesOrderItems)
            {
                item.IsDeleted = true;
                item.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Sales order soft deleted successfully with ID: {Id}", id);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting sales order with ID: {Id}", id);
            return Result<bool>.Failure("An error occurred while deleting the sales order");
        }
    }

    public async Task<Result<bool>> RestoreSalesOrderAsync(Guid id)
    {
        try
        {
            var salesOrder = await _context.SalesOrders
                .IgnoreQueryFilters()
                .Include(so => so.SalesOrderItems)
                .FirstOrDefaultAsync(so => so.Id == id && so.IsDeleted);

            if (salesOrder == null)
            {
                return Result<bool>.Failure("Deleted sales order not found");
            }

            // Restore the sales order and its items
            salesOrder.IsDeleted = false;
            salesOrder.UpdatedAt = DateTime.UtcNow;

            foreach (var item in salesOrder.SalesOrderItems.Where(soi => soi.IsDeleted))
            {
                item.IsDeleted = false;
                item.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Sales order restored successfully with ID: {Id}", id);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring sales order with ID: {Id}", id);
            return Result<bool>.Failure("An error occurred while restoring the sales order");
        }
    }

    public async Task<Result<PagedResult<SalesOrderDto>>> GetSalesOrdersByCustomerAsync(Guid customerId, SalesOrderQueryParameters parameters)
    {
        try
        {
            parameters.CustomerId = customerId;
            return await GetSalesOrdersAsync(parameters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sales orders for customer ID: {CustomerId}", customerId);
            return Result<PagedResult<SalesOrderDto>>.Failure("An error occurred while retrieving customer sales orders");
        }
    }

    public async Task<Result<decimal>> CalculateOrderTotalAsync(List<SalesOrderItemCreateDto> orderItems)
    {
        try
        {
            decimal total = 0;

            foreach (var item in orderItems)
            {
                // Validate product exists and is active
                var product = await _context.Products
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId && !p.IsDeleted);

                if (product == null)
                {
                    return Result<decimal>.Failure($"Product with ID {item.ProductId} not found or is inactive");
                }

                total += item.Quantity * item.UnitPrice;
            }

            return Result<decimal>.Success(total);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating order total");
            return Result<decimal>.Failure("An error occurred while calculating the order total");
        }
    }

    public async Task<Result<bool>> CanUpdateSalesOrderAsync(Guid id)
    {
        try
        {
            var salesOrder = await _context.SalesOrders
                .FirstOrDefaultAsync(so => so.Id == id && !so.IsDeleted);

            if (salesOrder == null)
            {
                return Result<bool>.Failure("Sales order not found");
            }

            // Define which statuses allow updates
            var updatableStatuses = new[] { SalesOrderStatus.New, SalesOrderStatus.Processing, SalesOrderStatus.OnHold };
            bool canUpdate = updatableStatuses.Contains(salesOrder.Status);

            return Result<bool>.Success(canUpdate);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if sales order can be updated. ID: {Id}", id);
            return Result<bool>.Failure("An error occurred while checking update permissions");
        }
    }

    public bool IsStatusTransitionValid(SalesOrderStatus currentStatus, SalesOrderStatus newStatus)
    {
        // Define valid status transitions
        var validTransitions = new Dictionary<SalesOrderStatus, SalesOrderStatus[]>
        {
            [SalesOrderStatus.New] = new[] { SalesOrderStatus.Processing, SalesOrderStatus.OnHold, SalesOrderStatus.Cancelled },
            [SalesOrderStatus.Processing] = new[] { SalesOrderStatus.Shipped, SalesOrderStatus.OnHold, SalesOrderStatus.Cancelled },
            [SalesOrderStatus.OnHold] = new[] { SalesOrderStatus.Processing, SalesOrderStatus.Cancelled },
            [SalesOrderStatus.Shipped] = new[] { SalesOrderStatus.Completed, SalesOrderStatus.Returned },
            [SalesOrderStatus.Completed] = new[] { SalesOrderStatus.Returned },
            [SalesOrderStatus.Cancelled] = new SalesOrderStatus[0], // No transitions from cancelled
            [SalesOrderStatus.Returned] = new SalesOrderStatus[0] // No transitions from returned
        };

        return validTransitions.ContainsKey(currentStatus) && 
               validTransitions[currentStatus].Contains(newStatus);
    }

    public async Task<Result<SalesOrderStatsDto>> GetSalesOrderStatsAsync(DateTime? fromDate = null, DateTime? toDate = null)
    {
        try
        {
            var query = _context.SalesOrders.AsQueryable();

            if (fromDate.HasValue)
            {
                query = query.Where(so => so.OrderDate >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(so => so.OrderDate <= toDate.Value);
            }

            var stats = await query
                .GroupBy(so => 1)
                .Select(g => new SalesOrderStatsDto
                {
                    TotalOrders = g.Count(),
                    TotalRevenue = g.Sum(so => so.TotalAmount),
                    NewOrders = g.Count(so => so.Status == SalesOrderStatus.New),
                    ProcessingOrders = g.Count(so => so.Status == SalesOrderStatus.Processing),
                    ShippedOrders = g.Count(so => so.Status == SalesOrderStatus.Shipped),
                    CompletedOrders = g.Count(so => so.Status == SalesOrderStatus.Completed),
                    CancelledOrders = g.Count(so => so.Status == SalesOrderStatus.Cancelled),
                    OnHoldOrders = g.Count(so => so.Status == SalesOrderStatus.OnHold),
                    AverageOrderValue = g.Average(so => so.TotalAmount)
                })
                .FirstOrDefaultAsync();

            stats ??= new SalesOrderStatsDto(); // Return empty stats if no data

            return Result<SalesOrderStatsDto>.Success(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sales order statistics");
            return Result<SalesOrderStatsDto>.Failure("An error occurred while retrieving sales order statistics");
        }
    }

    /// <summary>
    /// Generate a unique reference number for sales orders
    /// Format: SO-YYYYMM-####
    /// </summary>
    private async Task<Result<string>> GenerateReferenceNumberAsync()
    {
        try
        {
            var today = DateTime.UtcNow;
            var prefix = $"SO-{today:yyyyMM}-";

            // Get the last sales order reference number for this month
            var lastOrder = await _context.SalesOrders
                .Where(so => so.ReferenceNumber != null && so.ReferenceNumber.StartsWith(prefix))
                .OrderByDescending(so => so.ReferenceNumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastOrder?.ReferenceNumber != null)
            {
                var lastNumberPart = lastOrder.ReferenceNumber.Substring(prefix.Length);
                if (int.TryParse(lastNumberPart, out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            var referenceNumber = $"{prefix}{nextNumber:D4}";
            return Result<string>.Success(referenceNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating reference number");
            return Result<string>.Failure("An error occurred while generating reference number");
        }
    }
}

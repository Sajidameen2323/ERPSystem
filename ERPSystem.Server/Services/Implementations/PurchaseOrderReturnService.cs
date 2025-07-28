using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Server.Data;
using ERPSystem.Server.Models;
using ERPSystem.Server.DTOs.Returns;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;

namespace ERPSystem.Server.Services.Implementations;

public class PurchaseOrderReturnService : IPurchaseOrderReturnService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<PurchaseOrderReturnService> _logger;

    public PurchaseOrderReturnService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<PurchaseOrderReturnService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<PurchaseOrderReturnDto>> GetReturnsAsync(
        int page = 1,
        int pageSize = 10,
        string? search = null,
        ReturnStatus? status = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        try
        {
            var query = _context.PurchaseOrderReturns
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                .Include(r => r.Items)
                    .ThenInclude(i => i.Product)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(r => 
                    r.ReturnNumber.Contains(search) ||
                    r.PurchaseOrder.PONumber.Contains(search) ||
                    r.Supplier.Name.Contains(search));
            }

            if (status.HasValue)
            {
                query = query.Where(r => r.Status == status.Value);
            }

            if (dateFrom.HasValue)
            {
                query = query.Where(r => r.ReturnDate >= dateFrom.Value);
            }

            if (dateTo.HasValue)
            {
                query = query.Where(r => r.ReturnDate <= dateTo.Value);
            }

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .OrderByDescending(r => r.ReturnDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var returnDtos = _mapper.Map<List<PurchaseOrderReturnDto>>(items);

            return new PagedResult<PurchaseOrderReturnDto>
            {
                Items = returnDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving purchase order returns");
            return new PagedResult<PurchaseOrderReturnDto>
            {
                Items = new List<PurchaseOrderReturnDto>(),
                TotalCount = 0,
                CurrentPage = page,
                PageSize = pageSize
            };
        }
    }

    public async Task<Result<PurchaseOrderReturnDto>> GetReturnByIdAsync(Guid id)
    {
        try
        {
            var returnEntity = await _context.PurchaseOrderReturns
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                .Include(r => r.Items)
                    .ThenInclude(i => i.Product)
                .Include(r => r.Items)
                    .ThenInclude(i => i.PurchaseOrderItem)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (returnEntity == null)
            {
                return Result<PurchaseOrderReturnDto>.Failure("Purchase order return not found");
            }

            var returnDto = _mapper.Map<PurchaseOrderReturnDto>(returnEntity);
            return Result<PurchaseOrderReturnDto>.Success(returnDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving purchase order return {ReturnId}", id);
            return Result<PurchaseOrderReturnDto>.Failure("Error retrieving purchase order return");
        }
    }

    public async Task<Result<List<PurchaseOrderReturnDto>>> GetReturnsByPurchaseOrderIdAsync(Guid purchaseOrderId)
    {
        try
        {
            var returns = await _context.PurchaseOrderReturns
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                .Include(r => r.Items)
                    .ThenInclude(i => i.Product)
                .Include(r => r.Items)
                    .ThenInclude(i => i.PurchaseOrderItem)
                .Where(r => r.PurchaseOrderId == purchaseOrderId)
                .OrderByDescending(r => r.ReturnDate)
                .ToListAsync();

            var returnDtos = _mapper.Map<List<PurchaseOrderReturnDto>>(returns);
            return Result<List<PurchaseOrderReturnDto>>.Success(returnDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving returns for purchase order {PurchaseOrderId}", purchaseOrderId);
            return Result<List<PurchaseOrderReturnDto>>.Failure("Error retrieving returns for purchase order");
        }
    }

    public async Task<Result<PurchaseOrderReturnDto>> CreateReturnAsync(CreatePurchaseOrderReturnRequestDto request, string userId)
    {
        try
        {
            // Validate purchase order exists and is received
            var purchaseOrder = await _context.PurchaseOrders
                .Include(po => po.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(po => po.Id == request.PurchaseOrderId);

            if (purchaseOrder == null)
            {
                return Result<PurchaseOrderReturnDto>.Failure("Purchase order not found");
            }

            if (purchaseOrder.Status != PurchaseOrderStatus.Received && 
                purchaseOrder.Status != PurchaseOrderStatus.PartiallyReceived)
            {
                return Result<PurchaseOrderReturnDto>.Failure("Can only return items from received purchase orders");
            }

            // Validate return items
            var validationResult = await ValidateReturnItemsAsync(request.Items, purchaseOrder.Items);
            if (!validationResult.IsSuccess)
            {
                return Result<PurchaseOrderReturnDto>.Failure(validationResult.Error);
            }

            // Generate return number
            var returnNumber = await GenerateReturnNumberAsync();

            // Create return entity
            var returnEntity = _mapper.Map<PurchaseOrderReturn>(request);
            returnEntity.ReturnNumber = returnNumber;
            returnEntity.CreatedByUserId = userId;
            returnEntity.TotalReturnAmount = request.Items.Sum(i => i.ReturnQuantity * i.UnitPrice);

            _context.PurchaseOrderReturns.Add(returnEntity);
            await _context.SaveChangesAsync();

            // Create return items only (without stock updates)
            CreateReturnItemsAsync(request.Items, returnEntity.Id);

            await _context.SaveChangesAsync();

            // Return the created entity
            var createdReturn = await _context.PurchaseOrderReturns
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                .Include(r => r.Items)
                    .ThenInclude(i => i.Product)
                .FirstAsync(r => r.Id == returnEntity.Id);

            var returnDto = _mapper.Map<PurchaseOrderReturnDto>(createdReturn);
            return Result<PurchaseOrderReturnDto>.Success(returnDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating purchase order return");
            return Result<PurchaseOrderReturnDto>.Failure("Error creating purchase order return");
        }
    }

    public async Task<Result<PurchaseOrderReturnDto>> ApproveReturnAsync(Guid id, ApproveReturnDto request, string userId)
    {
        try
        {
            var returnEntity = await _context.PurchaseOrderReturns
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (returnEntity == null)
            {
                return Result<PurchaseOrderReturnDto>.Failure("Purchase order return not found");
            }

            if (returnEntity.Status != ReturnStatus.Pending)
            {
                return Result<PurchaseOrderReturnDto>.Failure("Can only approve pending returns");
            }

            returnEntity.Status = ReturnStatus.Approved;
            returnEntity.ApprovedByUserId = userId;
            returnEntity.ApprovedAt = DateTime.UtcNow;
            returnEntity.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(request.Notes))
            {
                returnEntity.Notes = (returnEntity.Notes + "\n" + request.Notes).Trim();
            }

            await _context.SaveChangesAsync();

            var updatedReturn = await _context.PurchaseOrderReturns
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                .Include(r => r.Items)
                    .ThenInclude(i => i.Product)
                .FirstAsync(r => r.Id == id);

            var returnDto = _mapper.Map<PurchaseOrderReturnDto>(updatedReturn);
            return Result<PurchaseOrderReturnDto>.Success(returnDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving return {ReturnId}", id);
            return Result<PurchaseOrderReturnDto>.Failure("Error approving return");
        }
    }

    public async Task<Result<PurchaseOrderReturnDto>> CancelReturnAsync(Guid id, CancelReturnDto request, string userId)
    {
        try
        {
            var returnEntity = await _context.PurchaseOrderReturns
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (returnEntity == null)
            {
                return Result<PurchaseOrderReturnDto>.Failure("Purchase order return not found");
            }

            if (returnEntity.Status != ReturnStatus.Pending)
            {
                return Result<PurchaseOrderReturnDto>.Failure("Can only cancel pending returns");
            }

            returnEntity.Status = ReturnStatus.Cancelled;
            returnEntity.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(request.Notes))
            {
                returnEntity.Notes = (returnEntity.Notes + "\n" + request.Notes).Trim();
            }

            await _context.SaveChangesAsync();

            var updatedReturn = await _context.PurchaseOrderReturns
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                .Include(r => r.Items)
                    .ThenInclude(i => i.Product)
                .FirstAsync(r => r.Id == id);

            var returnDto = _mapper.Map<PurchaseOrderReturnDto>(updatedReturn);
            return Result<PurchaseOrderReturnDto>.Success(returnDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling return {ReturnId}", id);
            return Result<PurchaseOrderReturnDto>.Failure("Error cancelling return");
        }
    }

    public async Task<Result<PurchaseOrderReturnDto>> ProcessReturnAsync(Guid id, ProcessPurchaseOrderReturnDto request, string userId)
    {
        try
        {
            var returnEntity = await _context.PurchaseOrderReturns
                .Include(r => r.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (returnEntity == null)
            {
                return Result<PurchaseOrderReturnDto>.Failure("Purchase order return not found");
            }

            if (returnEntity.Status != ReturnStatus.Approved)
            {
                return Result<PurchaseOrderReturnDto>.Failure("Can only process approved returns");
            }

            // Validate stock availability before processing
            var stockValidationResult = await ValidateStockForProcessingAsync(returnEntity.Items.ToList());
            if (!stockValidationResult.IsSuccess)
            {
                return Result<PurchaseOrderReturnDto>.Failure(stockValidationResult.Error);
            }

            // Update return items
            foreach (var itemUpdate in request.Items)
            {
                var returnItem = returnEntity.Items.FirstOrDefault(i => i.Id == itemUpdate.ReturnItemId);
                if (returnItem != null)
                {
                    returnItem.RefundProcessed = itemUpdate.RefundProcessed;
                    if (itemUpdate.RefundProcessed)
                    {
                        returnItem.RefundProcessedDate = DateTime.UtcNow;
                    }
                    if (!string.IsNullOrWhiteSpace(itemUpdate.Notes))
                    {
                        returnItem.Notes = (returnItem.Notes + "\n" + itemUpdate.Notes).Trim();
                    }
                    returnItem.UpdatedAt = DateTime.UtcNow;
                }
            }

            // Update return status
            returnEntity.Status = ReturnStatus.Processed;
            returnEntity.ProcessedByUserId = userId;
            returnEntity.ProcessedDate = DateTime.UtcNow;
            returnEntity.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(request.Notes))
            {
                returnEntity.Notes = (returnEntity.Notes + "\n" + request.Notes).Trim();
            }

            // Now process stock updates when return is being processed
            await ProcessStockUpdatesForReturnAsync(returnEntity.Items.ToList(), returnEntity.ReturnNumber, userId);

            await _context.SaveChangesAsync();

            var updatedReturn = await _context.PurchaseOrderReturns
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                .Include(r => r.Items)
                    .ThenInclude(i => i.Product)
                .FirstAsync(r => r.Id == id);

            var returnDto = _mapper.Map<PurchaseOrderReturnDto>(updatedReturn);
            return Result<PurchaseOrderReturnDto>.Success(returnDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing return {ReturnId}", id);
            return Result<PurchaseOrderReturnDto>.Failure("Error processing return");
        }
    }

    public async Task<Result<List<AvailableReturnItemDto>>> GetAvailableReturnItemsAsync(Guid purchaseOrderId)
    {
        try
        {
            var purchaseOrder = await _context.PurchaseOrders
                .Include(po => po.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(po => po.Id == purchaseOrderId);

            if (purchaseOrder == null)
            {
                return Result<List<AvailableReturnItemDto>>.Failure("Purchase order not found");
            }

            if (purchaseOrder.Status != PurchaseOrderStatus.Received && 
                purchaseOrder.Status != PurchaseOrderStatus.PartiallyReceived)
            {
                return Result<List<AvailableReturnItemDto>>.Failure("Can only return items from received purchase orders");
            }

            var availableItems = new List<AvailableReturnItemDto>();

            foreach (var item in purchaseOrder.Items.Where(i => i.ReceivedQuantity > 0))
            {
                // Calculate already returned quantity from processed returns only
                var returnedQuantity = await _context.PurchaseOrderReturnItems
                    .Include(ri => ri.PurchaseOrderReturn)
                    .Where(ri => ri.PurchaseOrderItemId == item.Id && 
                               ri.PurchaseOrderReturn.Status == ReturnStatus.Processed)
                    .SumAsync(ri => ri.ReturnQuantity);

                var availableForReturn = item.ReceivedQuantity - returnedQuantity;

                if (availableForReturn > 0)
                {
                    availableItems.Add(new AvailableReturnItemDto
                    {
                        PurchaseOrderItemId = item.Id,
                        ProductId = item.ProductId,
                        ProductName = item.Product.Name,
                        ProductSKU = item.Product.SKU,
                        OrderedQuantity = item.OrderedQuantity,
                        ReceivedQuantity = item.ReceivedQuantity,
                        ReturnedQuantity = returnedQuantity,
                        AvailableForReturn = availableForReturn,
                        CurrentStock = item.Product.CurrentStock,
                        UnitPrice = item.UnitPrice
                    });
                }
            }

            return Result<List<AvailableReturnItemDto>>.Success(availableItems);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving available return items for PO {PurchaseOrderId}", purchaseOrderId);
            return Result<List<AvailableReturnItemDto>>.Failure("Error retrieving available return items");
        }
    }

    private async Task<Result<bool>> ValidateReturnItemsAsync(
        IEnumerable<CreatePurchaseOrderReturnItemDto> returnItems, 
        IEnumerable<PurchaseOrderItem> purchaseOrderItems)
    {
        foreach (var item in returnItems)
        {
            var poItem = purchaseOrderItems.FirstOrDefault(i => i.Id == item.PurchaseOrderItemId);
            if (poItem == null)
            {
                return Result<bool>.Failure($"Purchase order item {item.PurchaseOrderItemId} not found");
            }

            if (item.ReturnQuantity <= 0)
            {
                return Result<bool>.Failure($"Return quantity must be greater than zero for product {poItem.Product?.Name ?? item.ProductId.ToString()}");
            }

            if (item.ReturnQuantity > poItem.ReceivedQuantity)
            {
                return Result<bool>.Failure($"Cannot return more items than received for product {poItem.Product?.Name ?? item.ProductId.ToString()}. Received: {poItem.ReceivedQuantity}, Attempting to return: {item.ReturnQuantity}");
            }

            // Check if there are already returns for this item (only count processed returns)
            var existingReturns = await _context.PurchaseOrderReturnItems
                .Include(ri => ri.PurchaseOrderReturn)
                .Where(ri => ri.PurchaseOrderItemId == item.PurchaseOrderItemId && 
                           ri.PurchaseOrderReturn.Status == ReturnStatus.Processed)
                .SumAsync(ri => ri.ReturnQuantity);

            if (item.ReturnQuantity + existingReturns > poItem.ReceivedQuantity)
            {
                return Result<bool>.Failure($"Total return quantity exceeds received quantity for product {poItem.Product?.Name ?? item.ProductId.ToString()}. Received: {poItem.ReceivedQuantity}, Already returned: {existingReturns}, Attempting to return: {item.ReturnQuantity}");
            }
        }

        return Result<bool>.Success(true);
    }

    private async Task<Result<bool>> ValidateStockForProcessingAsync(List<PurchaseOrderReturnItem> returnItems)
    {
        foreach (var returnItem in returnItems)
        {
            var product = await _context.Products.FindAsync(returnItem.ProductId);
            if (product == null)
            {
                return Result<bool>.Failure($"Product {returnItem.ProductId} not found");
            }

            if (product.CurrentStock < returnItem.ReturnQuantity)
            {
                return Result<bool>.Failure($"Insufficient stock to process return for product {product.Name}. Current stock: {product.CurrentStock}, Return quantity: {returnItem.ReturnQuantity}");
            }
        }

        return Result<bool>.Success(true);
    }

    public async Task<string> GenerateReturnNumberAsync()
    {
        var today = DateTime.UtcNow;
        var prefix = $"RTN-{today:yyyyMMdd}";
        
        var latestReturn = await _context.PurchaseOrderReturns
            .Where(r => r.ReturnNumber.StartsWith(prefix))
            .OrderByDescending(r => r.ReturnNumber)
            .FirstOrDefaultAsync();

        if (latestReturn == null)
        {
            return $"{prefix}-001";
        }

        var lastNumberStr = latestReturn.ReturnNumber.Substring(prefix.Length + 1);
        if (int.TryParse(lastNumberStr, out var lastNumber))
        {
            return $"{prefix}-{(lastNumber + 1):D3}";
        }

        return $"{prefix}-001";
    }

    private void CreateReturnItemsAsync(
        List<CreatePurchaseOrderReturnItemDto> items, 
        Guid returnId)
    {
        foreach (var itemDto in items)
        {
            var returnItem = _mapper.Map<PurchaseOrderReturnItem>(itemDto);
            returnItem.PurchaseOrderReturnId = returnId;
            returnItem.TotalReturnAmount = itemDto.ReturnQuantity * itemDto.UnitPrice;
            _context.PurchaseOrderReturnItems.Add(returnItem);
        }
    }

    private async Task ProcessStockUpdatesForReturnAsync(
        List<PurchaseOrderReturnItem> returnItems,
        string returnNumber,
        string userId)
    {
        foreach (var returnItem in returnItems)
        {
            // Validate stock availability before processing
            var product = await _context.Products.FindAsync(returnItem.ProductId);
            if (product == null)
            {
                throw new InvalidOperationException($"Product {returnItem.ProductId} not found");
            }

            if (product.CurrentStock < returnItem.ReturnQuantity)
            {
                throw new InvalidOperationException($"Insufficient stock to process return for product {product.Name}. Current stock: {product.CurrentStock}, Return quantity: {returnItem.ReturnQuantity}");
            }

            // Create stock movement for return
            var stockMovement = new StockMovement
            {
                ProductId = returnItem.ProductId,
                MovementType = StockMovementType.ReturnToSupplier,
                Quantity = -returnItem.ReturnQuantity, // Negative because we're removing from stock
                Reference = returnNumber,
                Reason = $"Return to supplier: {returnItem.ReasonDescription ?? returnItem.Reason.ToString()}",
                MovedByUserId = userId,
                Notes = $"Purchase Order Return: {returnNumber}"
            };

            // Update product stock
            stockMovement.StockBeforeMovement = product.CurrentStock;
            product.CurrentStock -= returnItem.ReturnQuantity;
            stockMovement.StockAfterMovement = product.CurrentStock;
            product.UpdatedAt = DateTime.UtcNow;

            _context.StockMovements.Add(stockMovement);
        }
    }
}

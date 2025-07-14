using AutoMapper;
using ERPSystem.Server.Common;
using ERPSystem.Server.Data;
using ERPSystem.Server.DTOs.SupplyChain;
using ERPSystem.Server.Models;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.Server.Services.Implementations;

public class PurchaseOrderService : IPurchaseOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<PurchaseOrderService> _logger;

    public PurchaseOrderService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<PurchaseOrderService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Result<PagedResult<PurchaseOrderDto>>> GetPurchaseOrdersAsync(
        Guid? supplierId = null,
        PurchaseOrderStatus? status = null,
        string? searchTerm = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 10,
        string? sortBy = null,
        string? sortDirection = "asc")
    {
        try
        {
            var query = _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(poi => poi.Product)
                .AsQueryable();

            // Apply filters
            if (supplierId.HasValue)
            {
                query = query.Where(po => po.SupplierId == supplierId.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(po => po.Status == status.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var search = searchTerm.ToLower();
                query = query.Where(po => po.PONumber.ToLower().Contains(search) ||
                                        po.Supplier.Name.ToLower().Contains(search));
            }

            if (fromDate.HasValue)
            {
                query = query.Where(po => po.OrderDate >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(po => po.OrderDate <= toDate.Value);
            }

            // Apply sorting
            query = sortBy?.ToLower() switch
            {
                "ponumber" => sortDirection?.ToLower() == "desc" ? query.OrderByDescending(po => po.PONumber) : query.OrderBy(po => po.PONumber),
                "supplier" => sortDirection?.ToLower() == "desc" ? query.OrderByDescending(po => po.Supplier.Name) : query.OrderBy(po => po.Supplier.Name),
                "status" => sortDirection?.ToLower() == "desc" ? query.OrderByDescending(po => po.Status) : query.OrderBy(po => po.Status),
                "orderdate" => sortDirection?.ToLower() == "desc" ? query.OrderByDescending(po => po.OrderDate) : query.OrderBy(po => po.OrderDate),
                "totalamount" => sortDirection?.ToLower() == "desc" ? query.OrderByDescending(po => po.TotalAmount) : query.OrderBy(po => po.TotalAmount),
                _ => query.OrderByDescending(po => po.CreatedAt)
            };

            var totalCount = await query.CountAsync();
            var purchaseOrders = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var purchaseOrderDtos = _mapper.Map<List<PurchaseOrderDto>>(purchaseOrders);

            var result = new PagedResult<PurchaseOrderDto>
            {
                Items = purchaseOrderDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };

            return Result<PagedResult<PurchaseOrderDto>>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting purchase orders");
            return Result<PagedResult<PurchaseOrderDto>>.Failure($"Failed to get purchase orders: {ex.Message}");
        }
    }

    public async Task<Result<PurchaseOrderDto>> GetPurchaseOrderByIdAsync(Guid id)
    {
        try
        {
            var purchaseOrder = await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(poi => poi.Product)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (purchaseOrder == null)
            {
                return Result<PurchaseOrderDto>.Failure("Purchase order not found");
            }

            var purchaseOrderDto = _mapper.Map<PurchaseOrderDto>(purchaseOrder);
            return Result<PurchaseOrderDto>.Success(purchaseOrderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting purchase order {PurchaseOrderId}", id);
            return Result<PurchaseOrderDto>.Failure($"Failed to get purchase order: {ex.Message}");
        }
    }

    public async Task<Result<PurchaseOrderDto>> CreatePurchaseOrderAsync(PurchaseOrderCreateDto dto, string userId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Validate supplier exists
            var supplier = await _context.Suppliers.FindAsync(dto.SupplierId);
            if (supplier == null)
            {
                return Result<PurchaseOrderDto>.Failure("Supplier not found");
            }

            // Validate all products exist
            var productIds = dto.Items.Select(i => i.ProductId).ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();

            if (products.Count != productIds.Count)
            {
                return Result<PurchaseOrderDto>.Failure("One or more products not found");
            }

            // Generate PO Number
            var poNumber = await GenerateNextPONumberAsync();

            // Create purchase order
            var purchaseOrder = _mapper.Map<PurchaseOrder>(dto);
            purchaseOrder.Id = Guid.NewGuid();
            purchaseOrder.PONumber = poNumber;
            purchaseOrder.CreatedByUserId = userId;

            // Create purchase order items
            decimal totalAmount = 0;
            var items = new List<PurchaseOrderItem>();

            foreach (var itemDto in dto.Items)
            {
                var item = _mapper.Map<PurchaseOrderItem>(itemDto);
                item.Id = Guid.NewGuid();
                item.PurchaseOrderId = purchaseOrder.Id;
                totalAmount += item.TotalPrice;
                items.Add(item);
            }

            purchaseOrder.TotalAmount = totalAmount;
            purchaseOrder.Items = items;

            _context.PurchaseOrders.Add(purchaseOrder);
            await _context.SaveChangesAsync();

            // Load navigation properties for return
            await _context.Entry(purchaseOrder)
                .Reference(po => po.Supplier)
                .LoadAsync();

            await transaction.CommitAsync();

            var purchaseOrderDto = _mapper.Map<PurchaseOrderDto>(purchaseOrder);
            _logger.LogInformation("Created purchase order {PurchaseOrderId} - {PONumber}", purchaseOrder.Id, purchaseOrder.PONumber);

            return Result<PurchaseOrderDto>.Success(purchaseOrderDto);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error creating purchase order");
            return Result<PurchaseOrderDto>.Failure($"Failed to create purchase order: {ex.Message}");
        }
    }

    public async Task<Result<PurchaseOrderDto>> UpdatePurchaseOrderAsync(Guid id, PurchaseOrderUpdateDto dto)
    {
        try
        {
            var purchaseOrder = await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(poi => poi.Product)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (purchaseOrder == null)
            {
                return Result<PurchaseOrderDto>.Failure("Purchase order not found");
            }

            if (purchaseOrder.Status != PurchaseOrderStatus.Draft)
            {
                return Result<PurchaseOrderDto>.Failure("Only draft purchase orders can be updated");
            }

            _mapper.Map(dto, purchaseOrder);
            purchaseOrder.UpdatedAt = DateTime.UtcNow;

            // Update items if provided
            if (dto.Items != null)
            {
                // Remove existing items
                _context.PurchaseOrderItems.RemoveRange(purchaseOrder.Items);

                // Add new items
                decimal totalAmount = 0;
                var newItems = new List<PurchaseOrderItem>();

                foreach (var itemDto in dto.Items)
                {
                    var item = _mapper.Map<PurchaseOrderItem>(itemDto);
                    if (item.Id == Guid.Empty)
                    {
                        item.Id = Guid.NewGuid();
                    }
                    item.PurchaseOrderId = purchaseOrder.Id;
                    totalAmount += item.TotalPrice;
                    newItems.Add(item);
                }

                purchaseOrder.Items = newItems;
                purchaseOrder.TotalAmount = totalAmount;
            }

            await _context.SaveChangesAsync();

            var purchaseOrderDto = _mapper.Map<PurchaseOrderDto>(purchaseOrder);
            _logger.LogInformation("Updated purchase order {PurchaseOrderId} - {PONumber}", purchaseOrder.Id, purchaseOrder.PONumber);

            return Result<PurchaseOrderDto>.Success(purchaseOrderDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating purchase order {PurchaseOrderId}", id);
            return Result<PurchaseOrderDto>.Failure($"Failed to update purchase order: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeletePurchaseOrderAsync(Guid id)
    {
        try
        {
            var purchaseOrder = await _context.PurchaseOrders
                .FirstOrDefaultAsync(po => po.Id == id);

            if (purchaseOrder == null)
            {
                return Result<bool>.Failure("Purchase order not found");
            }

            if (purchaseOrder.Status != PurchaseOrderStatus.Draft)
            {
                return Result<bool>.Failure("Only draft purchase orders can be deleted");
            }

            purchaseOrder.IsDeleted = true;
            purchaseOrder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted purchase order {PurchaseOrderId} - {PONumber}", purchaseOrder.Id, purchaseOrder.PONumber);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting purchase order {PurchaseOrderId}", id);
            return Result<bool>.Failure($"Failed to delete purchase order: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ApprovePurchaseOrderAsync(Guid id, string approvedByUserId)
    {
        try
        {
            var purchaseOrder = await _context.PurchaseOrders
                .FirstOrDefaultAsync(po => po.Id == id);

            if (purchaseOrder == null)
            {
                return Result<bool>.Failure("Purchase order not found");
            }

            if (purchaseOrder.Status != PurchaseOrderStatus.Pending)
            {
                return Result<bool>.Failure("Only pending purchase orders can be approved");
            }

            purchaseOrder.Status = PurchaseOrderStatus.Approved;
            purchaseOrder.ApprovedByUserId = approvedByUserId;
            purchaseOrder.ApprovedAt = DateTime.UtcNow;
            purchaseOrder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Approved purchase order {PurchaseOrderId} - {PONumber}", purchaseOrder.Id, purchaseOrder.PONumber);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving purchase order {PurchaseOrderId}", id);
            return Result<bool>.Failure($"Failed to approve purchase order: {ex.Message}");
        }
    }

    public async Task<Result<bool>> SendPurchaseOrderAsync(Guid id)
    {
        try
        {
            var purchaseOrder = await _context.PurchaseOrders
                .FirstOrDefaultAsync(po => po.Id == id);

            if (purchaseOrder == null)
            {
                return Result<bool>.Failure("Purchase order not found");
            }

            if (purchaseOrder.Status != PurchaseOrderStatus.Approved)
            {
                return Result<bool>.Failure("Only approved purchase orders can be sent");
            }

            purchaseOrder.Status = PurchaseOrderStatus.Sent;
            purchaseOrder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Sent purchase order {PurchaseOrderId} - {PONumber}", purchaseOrder.Id, purchaseOrder.PONumber);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending purchase order {PurchaseOrderId}", id);
            return Result<bool>.Failure($"Failed to send purchase order: {ex.Message}");
        }
    }

    public async Task<Result<bool>> CancelPurchaseOrderAsync(Guid id, string reason)
    {
        try
        {
            var purchaseOrder = await _context.PurchaseOrders
                .FirstOrDefaultAsync(po => po.Id == id);

            if (purchaseOrder == null)
            {
                return Result<bool>.Failure("Purchase order not found");
            }

            if (purchaseOrder.Status == PurchaseOrderStatus.Received)
            {
                return Result<bool>.Failure("Cannot cancel a fully received purchase order");
            }

            purchaseOrder.Status = PurchaseOrderStatus.Cancelled;
            purchaseOrder.Notes = $"{purchaseOrder.Notes}\n\nCancelled: {reason}";
            purchaseOrder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Cancelled purchase order {PurchaseOrderId} - {PONumber}", purchaseOrder.Id, purchaseOrder.PONumber);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling purchase order {PurchaseOrderId}", id);
            return Result<bool>.Failure($"Failed to cancel purchase order: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ReceiveItemAsync(Guid purchaseOrderItemId, ReceiveItemDto dto, string receivedByUserId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var item = await _context.PurchaseOrderItems
                .Include(poi => poi.PurchaseOrder)
                .Include(poi => poi.Product)
                .FirstOrDefaultAsync(poi => poi.Id == purchaseOrderItemId);

            if (item == null)
            {
                return Result<bool>.Failure("Purchase order item not found");
            }

            if (item.PurchaseOrder.Status != PurchaseOrderStatus.Sent)
            {
                return Result<bool>.Failure("Can only receive items from sent purchase orders");
            }

            var remainingQuantity = item.OrderedQuantity - item.ReceivedQuantity;
            if (dto.ReceivedQuantity > remainingQuantity)
            {
                return Result<bool>.Failure($"Cannot receive more than {remainingQuantity} items");
            }

            // Update item
            item.ReceivedQuantity += dto.ReceivedQuantity;
            item.ReceivedDate = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(dto.Notes))
            {
                item.Notes = $"{item.Notes}\n\nReceived {dto.ReceivedQuantity} on {DateTime.UtcNow:yyyy-MM-dd}: {dto.Notes}";
            }

            // Update product stock
            item.Product.CurrentStock += dto.ReceivedQuantity;
            item.Product.UpdatedAt = DateTime.UtcNow;

            // Create stock movement
            var stockMovement = new StockMovement
            {
                Id = Guid.NewGuid(),
                ProductId = item.ProductId,
                MovementType = StockMovementType.StockIn,
                Quantity = dto.ReceivedQuantity,
                StockBeforeMovement = item.Product.CurrentStock - dto.ReceivedQuantity,
                StockAfterMovement = item.Product.CurrentStock,
                Reference = item.PurchaseOrder.PONumber,
                Reason = $"Received from PO {item.PurchaseOrder.PONumber}",
                MovedByUserId = receivedByUserId,
                MovementDate = DateTime.UtcNow,
                Notes = dto.Notes
            };

            _context.StockMovements.Add(stockMovement);

            // Check if all items are fully received to update PO status
            var allItems = await _context.PurchaseOrderItems
                .Where(poi => poi.PurchaseOrderId == item.PurchaseOrderId)
                .ToListAsync();

            var allItemsReceived = allItems.All(poi => poi.ReceivedQuantity >= poi.OrderedQuantity);
            var someItemsReceived = allItems.Any(poi => poi.ReceivedQuantity > 0);

            if (allItemsReceived)
            {
                item.PurchaseOrder.Status = PurchaseOrderStatus.Received;
                item.PurchaseOrder.ActualDeliveryDate = DateTime.UtcNow;
            }
            else if (someItemsReceived)
            {
                item.PurchaseOrder.Status = PurchaseOrderStatus.PartiallyReceived;
            }

            item.PurchaseOrder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Received {Quantity} of item {ProductName} from PO {PONumber}", 
                dto.ReceivedQuantity, item.Product.Name, item.PurchaseOrder.PONumber);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error receiving purchase order item {PurchaseOrderItemId}", purchaseOrderItemId);
            return Result<bool>.Failure($"Failed to receive item: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ReceiveFullOrderAsync(Guid purchaseOrderId, string receivedByUserId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var purchaseOrder = await _context.PurchaseOrders
                .Include(po => po.Items)
                    .ThenInclude(poi => poi.Product)
                .FirstOrDefaultAsync(po => po.Id == purchaseOrderId);

            if (purchaseOrder == null)
            {
                return Result<bool>.Failure("Purchase order not found");
            }

            if (purchaseOrder.Status != PurchaseOrderStatus.Sent)
            {
                return Result<bool>.Failure("Can only receive items from sent purchase orders");
            }

            foreach (var item in purchaseOrder.Items)
            {
                var remainingQuantity = item.OrderedQuantity - item.ReceivedQuantity;
                if (remainingQuantity > 0)
                {
                    // Update item
                    item.ReceivedQuantity = item.OrderedQuantity;
                    item.ReceivedDate = DateTime.UtcNow;

                    // Update product stock
                    item.Product.CurrentStock += remainingQuantity;
                    item.Product.UpdatedAt = DateTime.UtcNow;

                    // Create stock movement
                    var stockMovement = new StockMovement
                    {
                        Id = Guid.NewGuid(),
                        ProductId = item.ProductId,
                        MovementType = StockMovementType.StockIn,
                        Quantity = remainingQuantity,
                        StockBeforeMovement = item.Product.CurrentStock - remainingQuantity,
                        StockAfterMovement = item.Product.CurrentStock,
                        Reference = purchaseOrder.PONumber,
                        Reason = $"Fully received from PO {purchaseOrder.PONumber}",
                        MovedByUserId = receivedByUserId,
                        MovementDate = DateTime.UtcNow
                    };

                    _context.StockMovements.Add(stockMovement);
                }
            }

            // Update purchase order status
            purchaseOrder.Status = PurchaseOrderStatus.Received;
            purchaseOrder.ActualDeliveryDate = DateTime.UtcNow;
            purchaseOrder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Fully received purchase order {PurchaseOrderId} - {PONumber}", 
                purchaseOrder.Id, purchaseOrder.PONumber);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error receiving full purchase order {PurchaseOrderId}", purchaseOrderId);
            return Result<bool>.Failure($"Failed to receive full order: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<StockMovementDto>>> GetStockMovementsAsync(
        Guid? productId = null,
        StockMovementType? movementType = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 10)
    {
        try
        {
            var query = _context.StockMovements
                .Include(sm => sm.Product)
                .AsQueryable();

            // Apply filters
            if (productId.HasValue)
            {
                query = query.Where(sm => sm.ProductId == productId.Value);
            }

            if (movementType.HasValue)
            {
                query = query.Where(sm => sm.MovementType == movementType.Value);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(sm => sm.MovementDate >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(sm => sm.MovementDate <= toDate.Value);
            }

            query = query.OrderByDescending(sm => sm.MovementDate);

            var totalCount = await query.CountAsync();
            var stockMovements = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var stockMovementDtos = _mapper.Map<List<StockMovementDto>>(stockMovements);

            var result = new PagedResult<StockMovementDto>
            {
                Items = stockMovementDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };

            return Result<PagedResult<StockMovementDto>>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stock movements");
            return Result<PagedResult<StockMovementDto>>.Failure($"Failed to get stock movements: {ex.Message}");
        }
    }

    public async Task<Result<StockMovementDto>> CreateStockMovementAsync(StockMovementCreateDto dto, string userId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null)
            {
                return Result<StockMovementDto>.Failure("Product not found");
            }

            var stockBefore = product.CurrentStock;
            var stockAfter = stockBefore + dto.Quantity;

            if (stockAfter < 0)
            {
                return Result<StockMovementDto>.Failure("Insufficient stock for this movement");
            }

            // Create stock movement
            var stockMovement = _mapper.Map<StockMovement>(dto);
            stockMovement.Id = Guid.NewGuid();
            stockMovement.StockBeforeMovement = stockBefore;
            stockMovement.StockAfterMovement = stockAfter;
            stockMovement.MovedByUserId = userId;

            // Update product stock
            product.CurrentStock = stockAfter;
            product.UpdatedAt = DateTime.UtcNow;

            _context.StockMovements.Add(stockMovement);
            await _context.SaveChangesAsync();

            // Load navigation properties
            await _context.Entry(stockMovement)
                .Reference(sm => sm.Product)
                .LoadAsync();

            await transaction.CommitAsync();

            var stockMovementDto = _mapper.Map<StockMovementDto>(stockMovement);
            _logger.LogInformation("Created stock movement {StockMovementId} for product {ProductName}", 
                stockMovement.Id, product.Name);

            return Result<StockMovementDto>.Success(stockMovementDto);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error creating stock movement");
            return Result<StockMovementDto>.Failure($"Failed to create stock movement: {ex.Message}");
        }
    }

    private async Task<string> GenerateNextPONumberAsync()
    {
        var lastPO = await _context.PurchaseOrders
            .Where(po => po.PONumber.StartsWith("PO"))
            .OrderByDescending(po => po.PONumber)
            .FirstOrDefaultAsync();

        var nextNumber = 1;
        if (lastPO != null && lastPO.PONumber.Length > 2)
        {
            var numberPart = lastPO.PONumber.Substring(2);
            if (int.TryParse(numberPart, out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"PO{nextNumber:D6}"; // Format: PO000001, PO000002, etc.
    }
}

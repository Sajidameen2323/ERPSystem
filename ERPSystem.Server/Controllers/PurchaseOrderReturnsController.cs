using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ERPSystem.Server.Data;
using ERPSystem.Server.Models;
using ERPSystem.Server.DTOs.Returns;
using ERPSystem.Server.Common;
using System.Security.Claims;

namespace ERPSystem.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PurchaseOrderReturnsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<PurchaseOrderReturnsController> _logger;

    public PurchaseOrderReturnsController(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<PurchaseOrderReturnsController> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get all purchase order returns with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<PurchaseOrderReturnDto>>> GetReturns(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] ReturnStatus? status = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null)
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

            return Ok(new PagedResult<PurchaseOrderReturnDto>
            {
                Items = returnDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving purchase order returns");
            return StatusCode(500, Result.Failure("An error occurred while retrieving returns"));
        }
    }

    /// <summary>
    /// Get a specific purchase order return by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Result<PurchaseOrderReturnDto>>> GetReturn(Guid id)
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
                return NotFound(Result.Failure("Purchase order return not found"));
            }

            var returnDto = _mapper.Map<PurchaseOrderReturnDto>(returnEntity);
            return Ok(Result<PurchaseOrderReturnDto>.Success(returnDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving purchase order return {ReturnId}", id);
            return StatusCode(500, Result.Failure("An error occurred while retrieving the return"));
        }
    }

    /// <summary>
    /// Create a new purchase order return
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Result<PurchaseOrderReturnDto>>> CreateReturn(
        [FromBody] CreatePurchaseOrderReturnRequestDto request)
    {
        try
        {
            // Get user ID from claims
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst("sub")?.Value 
                ?? "system";

            // Validate purchase order exists and is received
            var purchaseOrder = await _context.PurchaseOrders
                .Include(po => po.Items)
                .FirstOrDefaultAsync(po => po.Id == request.PurchaseOrderId);

            if (purchaseOrder == null)
            {
                return BadRequest(Result.Failure("Purchase order not found"));
            }

            if (purchaseOrder.Status != PurchaseOrderStatus.Received && 
                purchaseOrder.Status != PurchaseOrderStatus.PartiallyReceived)
            {
                return BadRequest(Result.Failure("Can only return items from received purchase orders"));
            }

            // Validate return items
            foreach (var item in request.Items)
            {
                var poItem = purchaseOrder.Items.FirstOrDefault(i => i.Id == item.PurchaseOrderItemId);
                if (poItem == null)
                {
                    return BadRequest(Result.Failure($"Purchase order item {item.PurchaseOrderItemId} not found"));
                }

                if (item.ReturnQuantity > poItem.ReceivedQuantity)
                {
                    return BadRequest(Result.Failure($"Cannot return more items than received for product {item.ProductId}"));
                }

                // Check if there are already returns for this item
                var existingReturns = await _context.PurchaseOrderReturnItems
                    .Where(ri => ri.PurchaseOrderItemId == item.PurchaseOrderItemId)
                    .SumAsync(ri => ri.ReturnQuantity);

                if (item.ReturnQuantity + existingReturns > poItem.ReceivedQuantity)
                {
                    return BadRequest(Result.Failure($"Total return quantity exceeds received quantity for product {item.ProductId}"));
                }
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

            // Create return items
            foreach (var itemDto in request.Items)
            {
                var returnItem = _mapper.Map<PurchaseOrderReturnItem>(itemDto);
                returnItem.PurchaseOrderReturnId = returnEntity.Id;
                returnItem.TotalReturnAmount = itemDto.ReturnQuantity * itemDto.UnitPrice;
                _context.PurchaseOrderReturnItems.Add(returnItem);

                // Create stock movement for return
                var stockMovement = new StockMovement
                {
                    ProductId = itemDto.ProductId,
                    MovementType = StockMovementType.Return,
                    Quantity = -itemDto.ReturnQuantity, // Negative because we're removing from stock
                    Reference = returnNumber,
                    Reason = $"Return to supplier: {itemDto.ReasonDescription ?? itemDto.Reason.ToString()}",
                    MovedByUserId = userId,
                    Notes = $"Purchase Order Return: {returnNumber}"
                };

                // Update product stock
                var product = await _context.Products.FindAsync(itemDto.ProductId);
                if (product != null)
                {
                    stockMovement.StockBeforeMovement = product.CurrentStock;
                    product.CurrentStock -= itemDto.ReturnQuantity;
                    stockMovement.StockAfterMovement = product.CurrentStock;
                    product.UpdatedAt = DateTime.UtcNow;
                }

                _context.StockMovements.Add(stockMovement);
            }

            await _context.SaveChangesAsync();

            // Return the created entity
            var createdReturn = await _context.PurchaseOrderReturns
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                .Include(r => r.Items)
                    .ThenInclude(i => i.Product)
                .FirstAsync(r => r.Id == returnEntity.Id);

            var returnDto = _mapper.Map<PurchaseOrderReturnDto>(createdReturn);
            return CreatedAtAction(nameof(GetReturn), new { id = returnEntity.Id }, Result<PurchaseOrderReturnDto>.Success(returnDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating purchase order return");
            return StatusCode(500, Result.Failure("An error occurred while creating the return"));
        }
    }

    /// <summary>
    /// Update return status (approve/cancel)
    /// </summary>
    [HttpPut("{id}/status")]
    public async Task<ActionResult<Result<PurchaseOrderReturnDto>>> UpdateReturnStatus(
        Guid id, 
        [FromBody] UpdatePurchaseOrderReturnStatusDto request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst("sub")?.Value 
                ?? "system";

            var returnEntity = await _context.PurchaseOrderReturns
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (returnEntity == null)
            {
                return NotFound(Result.Failure("Purchase order return not found"));
            }

            if (returnEntity.Status != ReturnStatus.Pending)
            {
                return BadRequest(Result.Failure("Can only update status of pending returns"));
            }

            returnEntity.Status = request.Status;
            returnEntity.UpdatedAt = DateTime.UtcNow;

            if (request.Status == ReturnStatus.Approved)
            {
                returnEntity.ApprovedByUserId = userId;
                returnEntity.ApprovedAt = DateTime.UtcNow;
            }

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
            return Ok(Result<PurchaseOrderReturnDto>.Success(returnDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating return status {ReturnId}", id);
            return StatusCode(500, Result.Failure("An error occurred while updating the return status"));
        }
    }

    /// <summary>
    /// Process return (mark refunds as processed)
    /// </summary>
    [HttpPut("{id}/process")]
    public async Task<ActionResult<Result<PurchaseOrderReturnDto>>> ProcessReturn(
        Guid id, 
        [FromBody] ProcessPurchaseOrderReturnDto request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst("sub")?.Value 
                ?? "system";

            var returnEntity = await _context.PurchaseOrderReturns
                .Include(r => r.Items)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (returnEntity == null)
            {
                return NotFound(Result.Failure("Purchase order return not found"));
            }

            if (returnEntity.Status != ReturnStatus.Approved)
            {
                return BadRequest(Result.Failure("Can only process approved returns"));
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

            await _context.SaveChangesAsync();

            var updatedReturn = await _context.PurchaseOrderReturns
                .Include(r => r.PurchaseOrder)
                .Include(r => r.Supplier)
                .Include(r => r.Items)
                    .ThenInclude(i => i.Product)
                .FirstAsync(r => r.Id == id);

            var returnDto = _mapper.Map<PurchaseOrderReturnDto>(updatedReturn);
            return Ok(Result<PurchaseOrderReturnDto>.Success(returnDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing return {ReturnId}", id);
            return StatusCode(500, Result.Failure("An error occurred while processing the return"));
        }
    }

    /// <summary>
    /// Get available items for return from a purchase order
    /// </summary>
    [HttpGet("purchase-order/{purchaseOrderId}/available-items")]
    public async Task<ActionResult<Result<List<AvailableReturnItemDto>>>> GetAvailableReturnItems(Guid purchaseOrderId)
    {
        try
        {
            var purchaseOrder = await _context.PurchaseOrders
                .Include(po => po.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(po => po.Id == purchaseOrderId);

            if (purchaseOrder == null)
            {
                return NotFound(Result.Failure("Purchase order not found"));
            }

            if (purchaseOrder.Status != PurchaseOrderStatus.Received && 
                purchaseOrder.Status != PurchaseOrderStatus.PartiallyReceived)
            {
                return BadRequest(Result.Failure("Can only return items from received purchase orders"));
            }

            var availableItems = new List<AvailableReturnItemDto>();

            foreach (var item in purchaseOrder.Items.Where(i => i.ReceivedQuantity > 0))
            {
                // Calculate already returned quantity
                var returnedQuantity = await _context.PurchaseOrderReturnItems
                    .Where(ri => ri.PurchaseOrderItemId == item.Id)
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
                        UnitPrice = item.UnitPrice
                    });
                }
            }

            return Ok(Result<List<AvailableReturnItemDto>>.Success(availableItems));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving available return items for PO {PurchaseOrderId}", purchaseOrderId);
            return StatusCode(500, Result.Failure("An error occurred while retrieving available items"));
        }
    }

    private async Task<string> GenerateReturnNumberAsync()
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
}

public class AvailableReturnItemDto
{
    public Guid PurchaseOrderItemId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public int OrderedQuantity { get; set; }
    public int ReceivedQuantity { get; set; }
    public int ReturnedQuantity { get; set; }
    public int AvailableForReturn { get; set; }
    public decimal UnitPrice { get; set; }
}

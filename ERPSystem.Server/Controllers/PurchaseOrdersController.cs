using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.SupplyChain;
using ERPSystem.Server.Models;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ERPSystem.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous] // Temporarily disabled authorization for testing
public class PurchaseOrdersController : ControllerBase
{
    private readonly IPurchaseOrderService _purchaseOrderService;
    private readonly ILogger<PurchaseOrdersController> _logger;

    public PurchaseOrdersController(
        IPurchaseOrderService purchaseOrderService,
        ILogger<PurchaseOrdersController> logger)
    {
        _purchaseOrderService = purchaseOrderService;
        _logger = logger;
    }

    /// <summary>
    /// Get all purchase orders with filtering and pagination
    /// </summary>
    [HttpGet]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> GetPurchaseOrders(
        [FromQuery] Guid? supplierId = null,
        [FromQuery] PurchaseOrderStatus? status = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = "asc")
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 10;

        var result = await _purchaseOrderService.GetPurchaseOrdersAsync(
            supplierId, status, searchTerm, fromDate, toDate, page, pageSize, sortBy, sortDirection);

        if (!result.IsSuccess)
        {
            return BadRequest(Result<PagedResult<PurchaseOrderDto>>.Failure(result.Error));
        }

        return Ok(Result<PagedResult<PurchaseOrderDto>>.Success(result.Data!));
    }

    /// <summary>
    /// Get purchase order by ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> GetPurchaseOrder(Guid id)
    {
        var result = await _purchaseOrderService.GetPurchaseOrderByIdAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<PurchaseOrderDto>.Failure("Purchase order not found"));
            }
            return BadRequest(Result<PurchaseOrderDto>.Failure(result.Error));
        }

        return Ok(Result<PurchaseOrderDto>.Success(result.Data!));
    }

    /// <summary>
    /// Create a new purchase order
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> CreatePurchaseOrder([FromBody] PurchaseOrderCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(Result<PurchaseOrderDto>.Failure(string.Join("; ", errors)));
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest(Result<PurchaseOrderDto>.Failure("User ID not found in token"));
        }

        var result = await _purchaseOrderService.CreatePurchaseOrderAsync(dto, userId);

        if (!result.IsSuccess)
        {
            return BadRequest(Result<PurchaseOrderDto>.Failure(result.Error));
        }

        return CreatedAtAction(nameof(GetPurchaseOrder), new { id = result.Data!.Id },
            Result<PurchaseOrderDto>.Success(result.Data!));
    }

    /// <summary>
    /// Update purchase order
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> UpdatePurchaseOrder(Guid id, [FromBody] PurchaseOrderUpdateDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(Result<PurchaseOrderDto>.Failure(string.Join("; ", errors)));
        }

        var result = await _purchaseOrderService.UpdatePurchaseOrderAsync(id, dto);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<PurchaseOrderDto>.Failure("Purchase order not found"));
            }
            return BadRequest(Result<PurchaseOrderDto>.Failure(result.Error));
        }

        return Ok(Result<PurchaseOrderDto>.Success(result.Data!));
    }

    /// <summary>
    /// Delete purchase order
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> DeletePurchaseOrder(Guid id)
    {
        var result = await _purchaseOrderService.DeletePurchaseOrderAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<bool>.Failure("Purchase order not found"));
            }
            return BadRequest(Result<bool>.Failure(result.Error));
        }

        return Ok(Result<bool>.Success(true));
    }

    /// <summary>
    /// Mark purchase order as pending
    /// </summary>
    [HttpPut("{id}/mark-pending")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> MarkPurchaseOrderPending(Guid id)
    {

        var result = await _purchaseOrderService.MarkPurchaseOrderPendingAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<bool>.Failure("Purchase order not found"));
            }
            return BadRequest(Result<bool>.Failure(result.Error));
        }

        return Ok(Result<bool>.Success(true));
    }


    /// <summary>
    /// Approve purchase order
    /// </summary>
    [HttpPut("{id}/approve")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> ApprovePurchaseOrder(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest(Result<bool>.Failure("User ID not found in token"));
        }

        var result = await _purchaseOrderService.ApprovePurchaseOrderAsync(id, userId);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<bool>.Failure("Purchase order not found"));
            }
            return BadRequest(Result<bool>.Failure(result.Error));
        }

        return Ok(Result<bool>.Success(true));
    }

    /// <summary>
    /// Send purchase order to supplier
    /// </summary>
    [HttpPut("{id}/send")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> SendPurchaseOrder(Guid id)
    {
        var result = await _purchaseOrderService.SendPurchaseOrderAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<bool>.Failure("Purchase order not found"));
            }
            return BadRequest(Result<bool>.Failure(result.Error));
        }

        return Ok(Result<bool>.Success(true));
    }

    /// <summary>
    /// Cancel purchase order
    /// </summary>
    [HttpPut("{id}/cancel")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> CancelPurchaseOrder(Guid id, [FromBody] string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            return BadRequest(Result<bool>.Failure("Cancellation reason is required"));
        }

        var result = await _purchaseOrderService.CancelPurchaseOrderAsync(id, reason);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<bool>.Failure("Purchase order not found"));
            }
            return BadRequest(Result<bool>.Failure(result.Error));
        }

        return Ok(Result<bool>.Success(true));
    }

    /// <summary>
    /// Receive individual item from purchase order
    /// </summary>
    [HttpPut("items/{itemId}/receive")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> ReceiveItem(Guid itemId, [FromBody] ReceiveItemDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(Result<bool>.Failure(string.Join("; ", errors)));
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest(Result<bool>.Failure("User ID not found in token"));
        }

        var result = await _purchaseOrderService.ReceiveItemAsync(itemId, dto, userId);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<bool>.Failure("Purchase order item not found"));
            }
            return BadRequest(Result<bool>.Failure(result.Error));
        }

        return Ok(Result<bool>.Success(true));
    }

    /// <summary>
    /// Receive full purchase order
    /// </summary>
    [HttpPut("{id}/receive-full")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> ReceiveFullOrder(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest(Result<bool>.Failure("User ID not found in token"));
        }

        var result = await _purchaseOrderService.ReceiveFullOrderAsync(id, userId);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<bool>.Failure("Purchase order not found"));
            }
            return BadRequest(Result<bool>.Failure(result.Error));
        }

        return Ok(Result<bool>.Success(true));
    }

    /// <summary>
    /// Get stock movements
    /// </summary>
    [HttpGet("stock-movements")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> GetStockMovements(
        [FromQuery] Guid? productId = null,
        [FromQuery] StockMovementType? movementType = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 10;

        var result = await _purchaseOrderService.GetStockMovementsAsync(
            productId, movementType, fromDate, toDate, page, pageSize);

        if (!result.IsSuccess)
        {
            return BadRequest(Result<PagedResult<StockMovementDto>>.Failure(result.Error));
        }

        return Ok(Result<PagedResult<StockMovementDto>>.Success(result.Data!));
    }

    /// <summary>
    /// Create manual stock movement
    /// </summary>
    [HttpPost("stock-movements")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> CreateStockMovement([FromBody] StockMovementCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(Result<StockMovementDto>.Failure(string.Join("; ", errors)));
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest(Result<StockMovementDto>.Failure("User ID not found in token"));
        }

        var result = await _purchaseOrderService.CreateStockMovementAsync(dto, userId);

        if (!result.IsSuccess)
        {
            return BadRequest(Result<StockMovementDto>.Failure(result.Error));
        }

        return Ok(Result<StockMovementDto>.Success(result.Data!));
    }
}

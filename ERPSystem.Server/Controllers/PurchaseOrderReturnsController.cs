using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ERPSystem.Server.DTOs.Returns;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;
using ERPSystem.Server.Models;
using System.Security.Claims;

namespace ERPSystem.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchaseOrderReturnsController : ControllerBase
{
    private readonly IPurchaseOrderReturnService _returnService;
    private readonly ILogger<PurchaseOrderReturnsController> _logger;

    public PurchaseOrderReturnsController(
        IPurchaseOrderReturnService returnService,
        ILogger<PurchaseOrderReturnsController> logger)
    {
        _returnService = returnService;
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
        [FromQuery] string? status = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null)
    {
        try
        {
            // Parse status if provided
            ReturnStatus? statusEnum = null;
            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ReturnStatus>(status, true, out var parsedStatus))
            {
                statusEnum = parsedStatus;
            }

            var result = await _returnService.GetReturnsAsync(page, pageSize, search, statusEnum, dateFrom, dateTo);
            return Ok(result);
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
            var result = await _returnService.GetReturnByIdAsync(id);
            
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving purchase order return {ReturnId}", id);
            return StatusCode(500, Result.Failure("An error occurred while retrieving the return"));
        }
    }

    /// <summary>
    /// Get all returns for a specific purchase order
    /// </summary>
    [HttpGet("purchase-order/{purchaseOrderId}")]
    public async Task<ActionResult<Result<List<PurchaseOrderReturnDto>>>> GetReturnsByPurchaseOrder(Guid purchaseOrderId)
    {
        try
        {
            var result = await _returnService.GetReturnsByPurchaseOrderIdAsync(purchaseOrderId);
            
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving returns for purchase order {PurchaseOrderId}", purchaseOrderId);
            return StatusCode(500, Result.Failure("An error occurred while retrieving returns"));
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

            var result = await _returnService.CreateReturnAsync(request, userId);
            
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetReturn), new { id = result.Data!.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating purchase order return");
            return StatusCode(500, Result.Failure("An error occurred while creating the return"));
        }
    }

    /// <summary>
    /// Approve a purchase order return
    /// </summary>
    [HttpPut("{id}/approve")]
    public async Task<ActionResult<Result<PurchaseOrderReturnDto>>> ApproveReturn(
        Guid id, 
        [FromBody] ApproveReturnDto request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst("sub")?.Value 
                ?? "system";

            var result = await _returnService.ApproveReturnAsync(id, request, userId);
            
            if (!result.IsSuccess)
            {
                if (result.Error == "Purchase order return not found")
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving return {ReturnId}", id);
            return StatusCode(500, Result.Failure("An error occurred while approving the return"));
        }
    }

    /// <summary>
    /// Cancel a purchase order return
    /// </summary>
    [HttpPut("{id}/cancel")]
    public async Task<ActionResult<Result<PurchaseOrderReturnDto>>> CancelReturn(
        Guid id, 
        [FromBody] CancelReturnDto request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? User.FindFirst("sub")?.Value 
                ?? "system";

            var result = await _returnService.CancelReturnAsync(id, request, userId);
            
            if (!result.IsSuccess)
            {
                if (result.Error == "Purchase order return not found")
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling return {ReturnId}", id);
            return StatusCode(500, Result.Failure("An error occurred while cancelling the return"));
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

            var result = await _returnService.ProcessReturnAsync(id, request, userId);
            
            if (!result.IsSuccess)
            {
                if (result.Error == "Purchase order return not found")
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
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
            var result = await _returnService.GetAvailableReturnItemsAsync(purchaseOrderId);
            
            if (!result.IsSuccess)
            {
                if (result.Error == "Purchase order not found")
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving available return items for PO {PurchaseOrderId}", purchaseOrderId);
            return StatusCode(500, Result.Failure("An error occurred while retrieving available items"));
        }
    }
}

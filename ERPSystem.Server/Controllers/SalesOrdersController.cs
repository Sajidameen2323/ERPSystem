using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.DTOs.Sales;
using ERPSystem.Server.Common;

namespace ERPSystem.Server.Controllers;

/// <summary>
/// Controller for managing sales orders in the ERP system
/// </summary>
[Authorize(Policy = Constants.Policies.SalesAccess)]
[ApiController]
[Route("api/[controller]")]
public class SalesOrdersController : ControllerBase
{
    private readonly ISalesOrderService _salesOrderService;
    private readonly ILogger<SalesOrdersController> _logger;

    public SalesOrdersController(ISalesOrderService salesOrderService, ILogger<SalesOrdersController> logger)
    {
        _salesOrderService = salesOrderService;
        _logger = logger;
    }

    /// <summary>
    /// Gets a paged list of sales orders
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<SalesOrderDto>>> GetSalesOrders([FromQuery] SalesOrderQueryParameters parameters)
    {
        var result = await _salesOrderService.GetSalesOrdersAsync(parameters);
        
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Gets a specific sales order by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SalesOrderDto>> GetSalesOrder(Guid id)
    {
        var result = await _salesOrderService.GetSalesOrderByIdAsync(id);
        
        if (!result.IsSuccess)
        {
            return NotFound(result.Error);
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Creates a new sales order
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SalesOrderDto>> CreateSalesOrder(SalesOrderCreateDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _salesOrderService.CreateSalesOrderAsync(createDto);
        
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        return CreatedAtAction(nameof(GetSalesOrder), new { id = result.Data!.Id }, result.Data);
    }

    /// <summary>
    /// Updates an existing sales order
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<SalesOrderDto>> UpdateSalesOrder(Guid id, SalesOrderUpdateDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _salesOrderService.UpdateSalesOrderAsync(id, updateDto, User.Identity?.Name);
        
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Updates the status of a sales order
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<SalesOrderDto>> UpdateOrderStatus(Guid id, SalesOrderStatusUpdateDto statusUpdate)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        
        if (statusUpdate.IsValidStatus())
        {
            var enumStatus = statusUpdate.GetStatusEnum();
            _logger.LogInformation("Converted to enum: {EnumStatus} (value: {EnumValue})", enumStatus, (int)enumStatus);
        }
                
        var result = await _salesOrderService.UpdateSalesOrderStatusAsync(id, statusUpdate);
        
        if (!result.IsSuccess)
        {
            _logger.LogError("Status update failed: {Error}", result.Error);
            return BadRequest(result.Error);
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Soft deletes a sales order
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSalesOrder(Guid id)
    {
        var result = await _salesOrderService.DeleteSalesOrderAsync(id);
        
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        return NoContent();
    }

    /// <summary>
    /// Restores a soft deleted sales order
    /// </summary>
    [HttpPost("{id}/restore")]
    public async Task<ActionResult> RestoreSalesOrder(Guid id)
    {
        var result = await _salesOrderService.RestoreSalesOrderAsync(id);
        
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        return NoContent();
    }

    /// <summary>
    /// Gets sales orders for a specific customer
    /// </summary>
    [HttpGet("customer/{customerId}")]
    public async Task<ActionResult<PagedResult<SalesOrderDto>>> GetSalesOrdersByCustomer(Guid customerId, [FromQuery] SalesOrderQueryParameters parameters)
    {
        var result = await _salesOrderService.GetSalesOrdersByCustomerAsync(customerId, parameters);
        
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Gets sales order statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<SalesOrderStatsDto>> GetSalesOrderStats([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
    {
        var result = await _salesOrderService.GetSalesOrderStatsAsync(fromDate, toDate);
        
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Checks if a sales order can be updated
    /// </summary>
    [HttpGet("{id}/can-update")]
    public async Task<ActionResult<bool>> CanUpdateSalesOrder(Guid id)
    {
        var result = await _salesOrderService.CanUpdateSalesOrderAsync(id);
        
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        return Ok(result.Data);
    }
}

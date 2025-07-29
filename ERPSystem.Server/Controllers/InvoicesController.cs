using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.DTOs.Sales;
using ERPSystem.Server.Common;
using ERPSystem.Server.Models;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Controllers;

/// <summary>
/// Controller for managing invoices in the ERP system
/// </summary>
[Authorize(Policy = Constants.Policies.SalesAccess)]
[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly ILogger<InvoicesController> _logger;

    public InvoicesController(IInvoiceService invoiceService, ILogger<InvoicesController> logger)
    {
        _invoiceService = invoiceService;
        _logger = logger;
    }

    /// <summary>
    /// Gets user ID from claims
    /// </summary>
    private string GetUserIdFromClaims()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value 
            ?? "system";
    }

    /// <summary>
    /// Gets a paged list of invoices
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<Result<PagedResult<InvoiceDto>>>> GetInvoices([FromQuery] InvoiceQueryParameters parameters)
    {
        var result = await _invoiceService.GetInvoicesAsync(parameters);
        return Ok(result);
    }

    /// <summary>
    /// Gets a specific invoice by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Result<InvoiceDto>>> GetInvoice(Guid id)
    {
        var result = await _invoiceService.GetInvoiceByIdAsync(id);
        return Ok(result);
    }

    /// <summary>
    /// Gets invoices for a specific sales order
    /// </summary>
    [HttpGet("sales-order/{salesOrderId}")]
    public async Task<ActionResult<Result<List<InvoiceDto>>>> GetInvoicesBySalesOrder(Guid salesOrderId)
    {
        var result = await _invoiceService.GetInvoicesBySalesOrderAsync(salesOrderId);
        return Ok(result);
    }

    /// <summary>
    /// Gets invoices for a specific customer
    /// </summary>
    [HttpGet("customer/{customerId}")]
    public async Task<ActionResult<Result<PagedResult<InvoiceDto>>>> GetInvoicesByCustomer(
        Guid customerId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        var result = await _invoiceService.GetInvoicesByCustomerAsync(customerId, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Gets overdue invoices
    /// </summary>
    [HttpGet("overdue")]
    public async Task<ActionResult<Result<PagedResult<InvoiceDto>>>> GetOverdueInvoices(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        var result = await _invoiceService.GetOverdueInvoicesAsync(page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Gets invoice statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<Result<InvoiceStatsDto>>> GetInvoiceStats(
        [FromQuery] DateTime? fromDate = null, 
        [FromQuery] DateTime? toDate = null)
    {
        var result = await _invoiceService.GetInvoiceStatsAsync(fromDate, toDate);
        return Ok(result);
    }

    /// <summary>
    /// Creates a new invoice
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Result<InvoiceDto>>> CreateInvoice([FromBody] InvoiceCreateDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetUserIdFromClaims();
        var result = await _invoiceService.CreateInvoiceAsync(createDto, userId);
        
        if (result.IsSuccess)
        {
            return CreatedAtAction(nameof(GetInvoice), new { id = result.Data!.Id }, result);
        }
        
        return Ok(result);
    }

    /// <summary>
    /// Creates an invoice from a sales order
    /// </summary>
    [HttpPost("from-sales-order/{salesOrderId}")]
    public async Task<ActionResult<Result<InvoiceDto>>> CreateInvoiceFromSalesOrder(
        Guid salesOrderId, 
        [FromBody] CreateInvoiceFromSalesOrderDto? requestDto = null)
    {
        var userId = GetUserIdFromClaims();
        var dueDate = requestDto?.DueDate;
        
        var result = await _invoiceService.CreateInvoiceFromSalesOrderAsync(salesOrderId, userId, dueDate);
        
        if (result.IsSuccess)
        {
            return CreatedAtAction(nameof(GetInvoice), new { id = result.Data!.Id }, result);
        }
        
        return Ok(result);
    }

    /// <summary>
    /// Updates an existing invoice
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<Result<InvoiceDto>>> UpdateInvoice(Guid id, [FromBody] InvoiceUpdateDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetUserIdFromClaims();
        var result = await _invoiceService.UpdateInvoiceAsync(id, updateDto, userId);
        return Ok(result);
    }

    /// <summary>
    /// Updates invoice status
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<Result<InvoiceDto>>> UpdateInvoiceStatus(Guid id, [FromBody] InvoiceStatusUpdateDto statusUpdateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetUserIdFromClaims();
        var result = await _invoiceService.UpdateInvoiceStatusAsync(id, statusUpdateDto, userId);
        return Ok(result);
    }

    /// <summary>
    /// Records a payment for an invoice
    /// </summary>
    [HttpPost("{id}/payments")]
    public async Task<ActionResult<Result<InvoiceDto>>> RecordPayment(Guid id, [FromBody] InvoicePaymentDto paymentDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetUserIdFromClaims();
        var result = await _invoiceService.RecordPaymentAsync(id, paymentDto, userId);
        return Ok(result);
    }

    /// <summary>
    /// Marks an invoice as sent
    /// </summary>
    [HttpPatch("{id}/mark-sent")]
    public async Task<ActionResult<Result<InvoiceDto>>> MarkInvoiceAsSent(Guid id)
    {
        var userId = GetUserIdFromClaims();
        var result = await _invoiceService.MarkInvoiceAsSentAsync(id, userId);
        return Ok(result);
    }

    /// <summary>
    /// Cancels an invoice
    /// </summary>
    [HttpPatch("{id}/cancel")]
    public async Task<ActionResult<Result<InvoiceDto>>> CancelInvoice(Guid id, [FromBody] CancelInvoiceDto? cancelDto = null)
    {
        var userId = GetUserIdFromClaims();
        var result = await _invoiceService.CancelInvoiceAsync(id, userId, cancelDto?.Reason);
        return Ok(result);
    }

    /// <summary>
    /// Deletes an invoice (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<Result<object>>> DeleteInvoice(Guid id)
    {
        var result = await _invoiceService.DeleteInvoiceAsync(id);
        return Ok(result);
    }

    /// <summary>
    /// Calculates invoice totals
    /// </summary>
    [HttpPost("calculate-totals")]
    public async Task<ActionResult<Result<InvoiceTotalsDto>>> CalculateInvoiceTotals([FromBody] CalculateInvoiceTotalsDto calculateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _invoiceService.CalculateInvoiceTotalsAsync(
            calculateDto.InvoiceItems, 
            calculateDto.TaxAmount, 
            calculateDto.DiscountAmount);
        
        return Ok(result);
    }

    /// <summary>
    /// Generates a new invoice number
    /// </summary>
    [HttpGet("generate-number")]
    public async Task<ActionResult<Result<string>>> GenerateInvoiceNumber()
    {
        var result = await _invoiceService.GenerateInvoiceNumberAsync();
        return Ok(result);
    }

    /// <summary>
    /// Checks if an invoice can be edited
    /// </summary>
    [HttpGet("{id}/can-edit")]
    public async Task<ActionResult<Result<bool>>> CanEditInvoice(Guid id)
    {
        var result = await _invoiceService.CanEditInvoiceAsync(id);
        return Ok(result);
    }

    /// <summary>
    /// Checks if an invoice can be cancelled
    /// </summary>
    [HttpGet("{id}/can-cancel")]
    public async Task<ActionResult<Result<bool>>> CanCancelInvoice(Guid id)
    {
        var result = await _invoiceService.CanCancelInvoiceAsync(id);
        return Ok(result);
    }
}

/// <summary>
/// DTO for creating invoice from sales order
/// </summary>
public class CreateInvoiceFromSalesOrderDto
{
    public DateTime? DueDate { get; set; }
}

/// <summary>
/// DTO for cancelling invoice
/// </summary>
public class CancelInvoiceDto
{
    [MaxLength(500)]
    public string? Reason { get; set; }
}

/// <summary>
/// DTO for calculating invoice totals
/// </summary>
public class CalculateInvoiceTotalsDto
{
    [Required]
    public List<InvoiceItemCreateDto> InvoiceItems { get; set; } = new();
    
    [Range(0, double.MaxValue)]
    public decimal TaxAmount { get; set; } = 0;
    
    [Range(0, double.MaxValue)]
    public decimal DiscountAmount { get; set; } = 0;
}

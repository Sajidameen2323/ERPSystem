using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Sales;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Services.Interfaces;

/// <summary>
/// Interface for invoice management operations
/// </summary>
public interface IInvoiceService
{
    /// <summary>
    /// Retrieves a paged list of invoices based on query parameters
    /// </summary>
    Task<Result<PagedResult<InvoiceDto>>> GetInvoicesAsync(InvoiceQueryParameters parameters);

    /// <summary>
    /// Retrieves a specific invoice by ID
    /// </summary>
    Task<Result<InvoiceDto>> GetInvoiceByIdAsync(Guid id);

    /// <summary>
    /// Retrieves invoices for a specific sales order
    /// </summary>
    Task<Result<List<InvoiceDto>>> GetInvoicesBySalesOrderAsync(Guid salesOrderId);

    /// <summary>
    /// Retrieves invoices for a specific customer
    /// </summary>
    Task<Result<PagedResult<InvoiceDto>>> GetInvoicesByCustomerAsync(Guid customerId, int page = 1, int pageSize = 10);

    /// <summary>
    /// Creates a new invoice from a sales order
    /// </summary>
    Task<Result<InvoiceDto>> CreateInvoiceAsync(InvoiceCreateDto createDto, string generatedByUserId);

    /// <summary>
    /// Creates an invoice automatically from a sales order
    /// </summary>
    Task<Result<InvoiceDto>> CreateInvoiceFromSalesOrderAsync(Guid salesOrderId, string generatedByUserId, DateTime? dueDate = null);

    /// <summary>
    /// Updates an existing invoice (only allowed for draft invoices)
    /// </summary>
    Task<Result<InvoiceDto>> UpdateInvoiceAsync(Guid id, InvoiceUpdateDto updateDto, string updatedByUserId);

    /// <summary>
    /// Updates the status of an invoice
    /// </summary>
    Task<Result<InvoiceDto>> UpdateInvoiceStatusAsync(Guid id, InvoiceStatusUpdateDto statusUpdateDto, string updatedByUserId);

    /// <summary>
    /// Records a payment for an invoice
    /// </summary>
    Task<Result<InvoiceDto>> RecordPaymentAsync(Guid id, InvoicePaymentDto paymentDto, string processedByUserId);

    /// <summary>
    /// Marks an invoice as sent
    /// </summary>
    Task<Result<InvoiceDto>> MarkInvoiceAsSentAsync(Guid id, string sentByUserId);

    /// <summary>
    /// Cancels an invoice (only allowed for draft or sent invoices)
    /// </summary>
    Task<Result<InvoiceDto>> CancelInvoiceAsync(Guid id, string cancelledByUserId, string? reason = null);

    /// <summary>
    /// Soft deletes an invoice (only allowed for draft invoices)
    /// </summary>
    Task<Result<bool>> DeleteInvoiceAsync(Guid id);

    /// <summary>
    /// Gets overdue invoices
    /// </summary>
    Task<Result<PagedResult<InvoiceDto>>> GetOverdueInvoicesAsync(int page = 1, int pageSize = 10);

    /// <summary>
    /// Gets invoice statistics for dashboard
    /// </summary>
    Task<Result<InvoiceStatsDto>> GetInvoiceStatsAsync(DateTime? fromDate = null, DateTime? toDate = null);

    /// <summary>
    /// Generates a unique invoice number
    /// </summary>
    Task<Result<string>> GenerateInvoiceNumberAsync();

    /// <summary>
    /// Validates if an invoice can be edited
    /// </summary>
    Task<Result<bool>> CanEditInvoiceAsync(Guid id);

    /// <summary>
    /// Validates if an invoice can be cancelled
    /// </summary>
    Task<Result<bool>> CanCancelInvoiceAsync(Guid id);

    /// <summary>
    /// Calculates invoice totals
    /// </summary>
    Task<Result<InvoiceTotalsDto>> CalculateInvoiceTotalsAsync(List<InvoiceItemCreateDto> items, decimal taxAmount = 0, decimal discountAmount = 0);

    /// <summary>
    /// Calculates invoice totals from update DTO
    /// </summary>
    Task<Result<InvoiceTotalsDto>> CalculateInvoiceTotalsFromUpdateDtoAsync(List<InvoiceItemUpdateDto> items, decimal taxAmount = 0, decimal discountAmount = 0);
}

/// <summary>
/// DTO for invoice statistics
/// </summary>
public class InvoiceStatsDto
{
    public decimal TotalInvoiced { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalOutstanding { get; set; }
    public decimal TotalOverdue { get; set; }
    public int TotalInvoiceCount { get; set; }
    public int PaidInvoiceCount { get; set; }
    public int OutstandingInvoiceCount { get; set; }
    public int OverdueInvoiceCount { get; set; }
    public decimal AverageInvoiceValue { get; set; }
    public int AveragePaymentDays { get; set; }
}

/// <summary>
/// DTO for invoice totals calculation
/// </summary>
public class InvoiceTotalsDto
{
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
}

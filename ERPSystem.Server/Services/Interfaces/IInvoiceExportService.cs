using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Sales;

namespace ERPSystem.Server.Services.Interfaces;

/// <summary>
/// Service interface for exporting invoices to various formats
/// </summary>
public interface IInvoiceExportService
{
    /// <summary>
    /// Generates a PDF for a single invoice
    /// </summary>
    /// <param name="invoiceId">The invoice ID</param>
    /// <returns>PDF as byte array</returns>
    Task<Result<byte[]>> GenerateInvoicePdfAsync(Guid invoiceId);

    /// <summary>
    /// Exports multiple invoices to Excel
    /// </summary>
    /// <param name="parameters">Query parameters for filtering invoices</param>
    /// <returns>Excel file as byte array</returns>
    Task<Result<byte[]>> ExportInvoicesToExcelAsync(InvoiceQueryParameters? parameters = null);

    /// <summary>
    /// Generates HTML content for an invoice (for printing)
    /// </summary>
    /// <param name="invoiceId">The invoice ID</param>
    /// <returns>HTML content as string</returns>
    Task<Result<string>> GenerateInvoiceHtmlAsync(Guid invoiceId);
}

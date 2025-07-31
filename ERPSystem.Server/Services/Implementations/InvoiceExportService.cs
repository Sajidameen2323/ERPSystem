using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Sales;
using ERPSystem.Server.Services.Interfaces;
using iTextSharp.text;
using iTextSharp.text.pdf;
using ClosedXML.Excel;
using System.Text;

namespace ERPSystem.Server.Services;

/// <summary>
/// Service for exporting invoices to various formats (PDF, Excel, HTML)
/// </summary>
public class InvoiceExportService : IInvoiceExportService
{
    private readonly IInvoiceService _invoiceService;
    private readonly ILogger<InvoiceExportService> _logger;

    public InvoiceExportService(IInvoiceService invoiceService, ILogger<InvoiceExportService> logger)
    {
        _invoiceService = invoiceService;
        _logger = logger;
    }

    public async Task<Result<byte[]>> GenerateInvoicePdfAsync(Guid invoiceId)
    {
        try
        {
            var invoiceResult = await _invoiceService.GetInvoiceByIdAsync(invoiceId);
            if (!invoiceResult.IsSuccess || invoiceResult.Data == null)
            {
                return Result<byte[]>.Failure(invoiceResult.Error ?? "Invoice not found");
            }

            var invoice = invoiceResult.Data;

            using var memoryStream = new MemoryStream();
            using var document = new Document(PageSize.A4, 50, 50, 50, 50);
            using var writer = PdfWriter.GetInstance(document, memoryStream);

            document.Open();

            // Company Header
            var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18);
            var headerFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12);
            var normalFont = FontFactory.GetFont(FontFactory.HELVETICA, 10);
            var boldFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10);

            // Company Info
            var companyTable = new PdfPTable(2) { WidthPercentage = 100 };
            companyTable.SetWidths(new float[] { 1, 1 });

            var companyCell = new PdfPCell();
            companyCell.Border = Rectangle.NO_BORDER;
            companyCell.AddElement(new Paragraph("ERP System Company", titleFont));
            companyCell.AddElement(new Paragraph("123 Business Street", normalFont));
            companyCell.AddElement(new Paragraph("Business City, BC 12345", normalFont));
            companyCell.AddElement(new Paragraph("Phone: (555) 123-4567", normalFont));
            companyCell.AddElement(new Paragraph("Email: info@erpsystem.com", normalFont));
            companyTable.AddCell(companyCell);

            var invoiceInfoCell = new PdfPCell();
            invoiceInfoCell.Border = Rectangle.NO_BORDER;
            invoiceInfoCell.HorizontalAlignment = Element.ALIGN_RIGHT;
            invoiceInfoCell.AddElement(new Paragraph("INVOICE", titleFont));
            invoiceInfoCell.AddElement(new Paragraph($"Invoice #: {invoice.InvoiceNumber}", boldFont));
            invoiceInfoCell.AddElement(new Paragraph($"Date: {invoice.InvoiceDate.ToString("MMM dd, yyyy")}", normalFont));
            invoiceInfoCell.AddElement(new Paragraph($"Due Date: {invoice.DueDate.ToString("MMM dd, yyyy")}", normalFont));
            invoiceInfoCell.AddElement(new Paragraph($"Status: {invoice.Status.ToString()}", normalFont));
            companyTable.AddCell(invoiceInfoCell);

            document.Add(companyTable);
            document.Add(new Paragraph(" ")); // Space

            // Customer Information
            var customerTable = new PdfPTable(2) { WidthPercentage = 100 };
            customerTable.SetWidths(new float[] { 1, 1 });

            var billToCell = new PdfPCell();
            billToCell.Border = Rectangle.NO_BORDER;
            billToCell.AddElement(new Paragraph("Bill To:", headerFont));
            billToCell.AddElement(new Paragraph(invoice.CustomerName, boldFont));
            billToCell.AddElement(new Paragraph(invoice.CustomerEmail, normalFont));
            customerTable.AddCell(billToCell);

            var salesOrderCell = new PdfPCell();
            salesOrderCell.Border = Rectangle.NO_BORDER;
            salesOrderCell.HorizontalAlignment = Element.ALIGN_RIGHT;
            salesOrderCell.AddElement(new Paragraph("Sales Order:", headerFont));
            salesOrderCell.AddElement(new Paragraph(invoice.SalesOrderReferenceNumber, normalFont));
            customerTable.AddCell(salesOrderCell);

            document.Add(customerTable);
            document.Add(new Paragraph(" ")); // Space

            // Invoice Items Table
            var itemsTable = new PdfPTable(5) { WidthPercentage = 100 };
            itemsTable.SetWidths(new float[] { 3, 1, 1, 1, 1 });

            // Header
            var lightGray = new BaseColor(240, 240, 240);
            itemsTable.AddCell(new PdfPCell(new Phrase("Description", headerFont)) { BackgroundColor = lightGray, Padding = 8 });
            itemsTable.AddCell(new PdfPCell(new Phrase("Qty", headerFont)) { BackgroundColor = lightGray, Padding = 8, HorizontalAlignment = Element.ALIGN_CENTER });
            itemsTable.AddCell(new PdfPCell(new Phrase("Unit Price", headerFont)) { BackgroundColor = lightGray, Padding = 8, HorizontalAlignment = Element.ALIGN_RIGHT });
            itemsTable.AddCell(new PdfPCell(new Phrase("Tax", headerFont)) { BackgroundColor = lightGray, Padding = 8, HorizontalAlignment = Element.ALIGN_RIGHT });
            itemsTable.AddCell(new PdfPCell(new Phrase("Total", headerFont)) { BackgroundColor = lightGray, Padding = 8, HorizontalAlignment = Element.ALIGN_RIGHT });

            // Items
            foreach (var item in invoice.InvoiceItems)
            {
                itemsTable.AddCell(new PdfPCell(new Phrase($"{item.ProductName}\n{item.Description ?? ""}", normalFont)) { Padding = 8 });
                itemsTable.AddCell(new PdfPCell(new Phrase(item.Quantity.ToString(), normalFont)) { Padding = 8, HorizontalAlignment = Element.ALIGN_CENTER });
                itemsTable.AddCell(new PdfPCell(new Phrase($"${item.UnitPrice:F2}", normalFont)) { Padding = 8, HorizontalAlignment = Element.ALIGN_RIGHT });
                itemsTable.AddCell(new PdfPCell(new Phrase("-", normalFont)) { Padding = 8, HorizontalAlignment = Element.ALIGN_RIGHT });
                itemsTable.AddCell(new PdfPCell(new Phrase($"${item.LineTotal:F2}", normalFont)) { Padding = 8, HorizontalAlignment = Element.ALIGN_RIGHT });
            }

            document.Add(itemsTable);

            // Totals
            var totalsTable = new PdfPTable(2) { WidthPercentage = 50, HorizontalAlignment = Element.ALIGN_RIGHT };
            totalsTable.SetWidths(new float[] { 1, 1 });

            totalsTable.AddCell(new PdfPCell(new Phrase("Subtotal:", boldFont)) { Border = Rectangle.NO_BORDER, HorizontalAlignment = Element.ALIGN_RIGHT, Padding = 5 });
            totalsTable.AddCell(new PdfPCell(new Phrase($"${invoice.SubTotal:F2}", normalFont)) { Border = Rectangle.NO_BORDER, HorizontalAlignment = Element.ALIGN_RIGHT, Padding = 5 });

            if (invoice.DiscountAmount > 0)
            {
                totalsTable.AddCell(new PdfPCell(new Phrase("Discount:", boldFont)) { Border = Rectangle.NO_BORDER, HorizontalAlignment = Element.ALIGN_RIGHT, Padding = 5 });
                totalsTable.AddCell(new PdfPCell(new Phrase($"-${invoice.DiscountAmount:F2}", normalFont)) { Border = Rectangle.NO_BORDER, HorizontalAlignment = Element.ALIGN_RIGHT, Padding = 5 });
            }

            totalsTable.AddCell(new PdfPCell(new Phrase("Tax:", boldFont)) { Border = Rectangle.NO_BORDER, HorizontalAlignment = Element.ALIGN_RIGHT, Padding = 5 });
            totalsTable.AddCell(new PdfPCell(new Phrase($"${invoice.TaxAmount:F2}", normalFont)) { Border = Rectangle.NO_BORDER, HorizontalAlignment = Element.ALIGN_RIGHT, Padding = 5 });

            totalsTable.AddCell(new PdfPCell(new Phrase("Total:", headerFont)) { Border = Rectangle.TOP_BORDER, HorizontalAlignment = Element.ALIGN_RIGHT, Padding = 8 });
            totalsTable.AddCell(new PdfPCell(new Phrase($"${invoice.TotalAmount:F2}", headerFont)) { Border = Rectangle.TOP_BORDER, HorizontalAlignment = Element.ALIGN_RIGHT, Padding = 8 });

            if (invoice.PaidAmount > 0)
            {
                totalsTable.AddCell(new PdfPCell(new Phrase("Paid:", boldFont)) { Border = Rectangle.NO_BORDER, HorizontalAlignment = Element.ALIGN_RIGHT, Padding = 5 });
                totalsTable.AddCell(new PdfPCell(new Phrase($"${invoice.PaidAmount:F2}", normalFont)) { Border = Rectangle.NO_BORDER, HorizontalAlignment = Element.ALIGN_RIGHT, Padding = 5 });

                totalsTable.AddCell(new PdfPCell(new Phrase("Balance Due:", headerFont)) { Border = Rectangle.TOP_BORDER, HorizontalAlignment = Element.ALIGN_RIGHT, Padding = 8 });
                totalsTable.AddCell(new PdfPCell(new Phrase($"${invoice.BalanceAmount:F2}", headerFont)) { Border = Rectangle.TOP_BORDER, HorizontalAlignment = Element.ALIGN_RIGHT, Padding = 8 });
            }

            document.Add(new Paragraph(" "));
            document.Add(totalsTable);

            // Terms and Notes
            if (!string.IsNullOrEmpty(invoice.Terms) || !string.IsNullOrEmpty(invoice.Notes))
            {
                document.Add(new Paragraph(" "));
                document.Add(new Paragraph(" "));

                if (!string.IsNullOrEmpty(invoice.Terms))
                {
                    document.Add(new Paragraph("Terms & Conditions:", headerFont));
                    document.Add(new Paragraph(invoice.Terms, normalFont));
                    document.Add(new Paragraph(" "));
                }

                if (!string.IsNullOrEmpty(invoice.Notes))
                {
                    document.Add(new Paragraph("Notes:", headerFont));
                    document.Add(new Paragraph(invoice.Notes, normalFont));
                }
            }

            document.Close();

            return Result<byte[]>.Success(memoryStream.ToArray());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF for invoice {InvoiceId}", invoiceId);
            return Result<byte[]>.Failure("An error occurred while generating the PDF");
        }
    }

    public async Task<Result<byte[]>> ExportInvoicesToExcelAsync(InvoiceQueryParameters? parameters = null)
    {
        try
        {
            var invoicesResult = await _invoiceService.GetInvoicesAsync(parameters ?? new InvoiceQueryParameters { PageSize = int.MaxValue });
            if (!invoicesResult.IsSuccess || invoicesResult.Data?.Items == null)
            {
                return Result<byte[]>.Failure(invoicesResult.Error ?? "No invoices found");
            }

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Invoices");

            // Headers
            worksheet.Cell(1, 1).Value = "Invoice Number";
            worksheet.Cell(1, 2).Value = "Customer Name";
            worksheet.Cell(1, 3).Value = "Customer Email";
            worksheet.Cell(1, 4).Value = "Sales Order";
            worksheet.Cell(1, 5).Value = "Status";
            worksheet.Cell(1, 6).Value = "Invoice Date";
            worksheet.Cell(1, 7).Value = "Due Date";
            worksheet.Cell(1, 8).Value = "Subtotal";
            worksheet.Cell(1, 9).Value = "Tax Amount";
            worksheet.Cell(1, 10).Value = "Discount Amount";
            worksheet.Cell(1, 11).Value = "Total Amount";
            worksheet.Cell(1, 12).Value = "Paid Amount";
            worksheet.Cell(1, 13).Value = "Balance Amount";
            worksheet.Cell(1, 14).Value = "Paid Date";
            worksheet.Cell(1, 15).Value = "Notes";
            worksheet.Cell(1, 16).Value = "Terms";
            worksheet.Cell(1, 17).Value = "Created Date";

            // Style headers
            var headerRange = worksheet.Range(1, 1, 1, 17);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;
            headerRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thick;

            // Data
            var row = 2;
            foreach (var invoice in invoicesResult.Data.Items)
            {
                worksheet.Cell(row, 1).Value = invoice.InvoiceNumber;
                worksheet.Cell(row, 2).Value = invoice.CustomerName;
                worksheet.Cell(row, 3).Value = invoice.CustomerEmail;
                worksheet.Cell(row, 4).Value = invoice.SalesOrderReferenceNumber;
                worksheet.Cell(row, 5).Value = invoice.Status.ToString();
                worksheet.Cell(row, 6).Value = invoice.InvoiceDate.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 7).Value = invoice.DueDate.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 8).Value = invoice.SubTotal;
                worksheet.Cell(row, 9).Value = invoice.TaxAmount;
                worksheet.Cell(row, 10).Value = invoice.DiscountAmount;
                worksheet.Cell(row, 11).Value = invoice.TotalAmount;
                worksheet.Cell(row, 12).Value = invoice.PaidAmount;
                worksheet.Cell(row, 13).Value = invoice.BalanceAmount;
                worksheet.Cell(row, 14).Value = invoice.PaidDate?.ToString("yyyy-MM-dd") ?? "";
                worksheet.Cell(row, 15).Value = invoice.Notes ?? "";
                worksheet.Cell(row, 16).Value = invoice.Terms ?? "";
                worksheet.Cell(row, 17).Value = invoice.CreatedAt.ToString("yyyy-MM-dd HH:mm");

                row++;
            }

            // Auto-fit columns
            worksheet.Columns().AdjustToContents();

            // Format currency columns
            worksheet.Range(2, 8, row - 1, 13).Style.NumberFormat.Format = "$#,##0.00";
            
            // Format date columns
            worksheet.Range(2, 6, row - 1, 7).Style.NumberFormat.Format = "mm/dd/yyyy";
            worksheet.Range(2, 14, row - 1, 14).Style.NumberFormat.Format = "mm/dd/yyyy";
            worksheet.Range(2, 17, row - 1, 17).Style.NumberFormat.Format = "mm/dd/yyyy hh:mm";

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return Result<byte[]>.Success(stream.ToArray());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting invoices to Excel");
            return Result<byte[]>.Failure("An error occurred while exporting to Excel");
        }
    }

    public async Task<Result<string>> GenerateInvoiceHtmlAsync(Guid invoiceId)
    {
        try
        {
            var invoiceResult = await _invoiceService.GetInvoiceByIdAsync(invoiceId);
            if (!invoiceResult.IsSuccess || invoiceResult.Data == null)
            {
                return Result<string>.Failure(invoiceResult.Error ?? "Invoice not found");
            }

            var invoice = invoiceResult.Data;

            var html = new StringBuilder();
            html.AppendLine("<!DOCTYPE html>");
            html.AppendLine("<html>");
            html.AppendLine("<head>");
            html.AppendLine("<meta charset='utf-8'>");
            html.AppendLine("<title>Invoice " + invoice.InvoiceNumber + "</title>");
            html.AppendLine("<style>");
            html.AppendLine(@"
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: white;
                    color: #333;
                }
                .invoice-header { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                }
                .company-info h1 { 
                    margin: 0; 
                    color: #2563eb; 
                    font-size: 24px;
                }
                .company-info p { 
                    margin: 2px 0; 
                    color: #666;
                }
                .invoice-info { 
                    text-align: right; 
                }
                .invoice-info h2 { 
                    margin: 0; 
                    font-size: 28px; 
                    color: #333;
                }
                .invoice-details { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 30px; 
                }
                .bill-to h3, .sales-order h3 { 
                    margin: 0 0 10px 0; 
                    color: #333;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 5px;
                }
                .sales-order { 
                    text-align: right; 
                }
                .items-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 20px; 
                }
                .items-table th, .items-table td { 
                    border: 1px solid #ddd; 
                    padding: 12px; 
                    text-align: left; 
                }
                .items-table th { 
                    background-color: #f8f9fa; 
                    font-weight: bold;
                    color: #333;
                }
                .items-table td.number { 
                    text-align: right; 
                }
                .totals { 
                    float: right; 
                    width: 300px; 
                }
                .totals table { 
                    width: 100%; 
                    border-collapse: collapse; 
                }
                .totals td { 
                    padding: 8px; 
                    border-bottom: 1px solid #eee; 
                }
                .totals .total-row { 
                    font-weight: bold; 
                    border-top: 2px solid #333; 
                    background-color: #f8f9fa;
                }
                .terms-notes { 
                    clear: both; 
                    margin-top: 40px; 
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
                .terms-notes h4 { 
                    margin: 0 0 10px 0; 
                    color: #333;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .invoice-header, .invoice-details, .totals, .terms-notes { page-break-inside: avoid; }
                }
            ");
            html.AppendLine("</style>");
            html.AppendLine("</head>");
            html.AppendLine("<body>");

            // Header
            html.AppendLine("<div class='invoice-header'>");
            html.AppendLine("<div class='company-info'>");
            html.AppendLine("<h1>ERP System Company</h1>");
            html.AppendLine("<p>123 Business Street</p>");
            html.AppendLine("<p>Business City, BC 12345</p>");
            html.AppendLine("<p>Phone: (555) 123-4567</p>");
            html.AppendLine("<p>Email: info@erpsystem.com</p>");
            html.AppendLine("</div>");
            html.AppendLine("<div class='invoice-info'>");
            html.AppendLine("<h2>INVOICE</h2>");
            html.AppendLine($"<p><strong>Invoice #:</strong> {invoice.InvoiceNumber}</p>");
            html.AppendLine($"<p><strong>Date:</strong> {invoice.InvoiceDate.ToString("MMM dd, yyyy")}</p>");
            html.AppendLine($"<p><strong>Due Date:</strong> {invoice.DueDate.ToString("MMM dd, yyyy")}</p>");
            html.AppendLine($"<p><strong>Status:</strong> {invoice.Status.ToString()}</p>");
            html.AppendLine("</div>");
            html.AppendLine("</div>");

            // Customer and Sales Order Info
            html.AppendLine("<div class='invoice-details'>");
            html.AppendLine("<div class='bill-to'>");
            html.AppendLine("<h3>Bill To:</h3>");
            html.AppendLine($"<p><strong>{invoice.CustomerName}</strong></p>");
            html.AppendLine($"<p>{invoice.CustomerEmail}</p>");
            html.AppendLine("</div>");
            html.AppendLine("<div class='sales-order'>");
            html.AppendLine("<h3>Sales Order:</h3>");
            html.AppendLine($"<p>{invoice.SalesOrderReferenceNumber}</p>");
            html.AppendLine("</div>");
            html.AppendLine("</div>");

            // Items Table
            html.AppendLine("<table class='items-table'>");
            html.AppendLine("<thead>");
            html.AppendLine("<tr>");
            html.AppendLine("<th>Description</th>");
            html.AppendLine("<th>Qty</th>");
            html.AppendLine("<th>Unit Price</th>");
            html.AppendLine("<th>Total</th>");
            html.AppendLine("</tr>");
            html.AppendLine("</thead>");
            html.AppendLine("<tbody>");

            foreach (var item in invoice.InvoiceItems)
            {
                html.AppendLine("<tr>");
                html.AppendLine($"<td>{item.ProductName}<br><small>{item.Description ?? ""}</small></td>");
                html.AppendLine($"<td class='number'>{item.Quantity}</td>");
                html.AppendLine($"<td class='number'>${item.UnitPrice:F2}</td>");
                html.AppendLine($"<td class='number'>${item.LineTotal:F2}</td>");
                html.AppendLine("</tr>");
            }

            html.AppendLine("</tbody>");
            html.AppendLine("</table>");

            // Totals
            html.AppendLine("<div class='totals'>");
            html.AppendLine("<table>");
            html.AppendLine($"<tr><td>Subtotal:</td><td class='number'>${invoice.SubTotal:F2}</td></tr>");
            
            if (invoice.DiscountAmount > 0)
            {
                html.AppendLine($"<tr><td>Discount:</td><td class='number'>-${invoice.DiscountAmount:F2}</td></tr>");
            }
            
            html.AppendLine($"<tr><td>Tax:</td><td class='number'>${invoice.TaxAmount:F2}</td></tr>");
            html.AppendLine($"<tr class='total-row'><td><strong>Total:</strong></td><td class='number'><strong>${invoice.TotalAmount:F2}</strong></td></tr>");
            
            if (invoice.PaidAmount > 0)
            {
                html.AppendLine($"<tr><td>Paid:</td><td class='number'>${invoice.PaidAmount:F2}</td></tr>");
                html.AppendLine($"<tr class='total-row'><td><strong>Balance Due:</strong></td><td class='number'><strong>${invoice.BalanceAmount:F2}</strong></td></tr>");
            }
            
            html.AppendLine("</table>");
            html.AppendLine("</div>");

            // Terms and Notes
            if (!string.IsNullOrEmpty(invoice.Terms) || !string.IsNullOrEmpty(invoice.Notes))
            {
                html.AppendLine("<div class='terms-notes'>");
                
                if (!string.IsNullOrEmpty(invoice.Terms))
                {
                    html.AppendLine("<div>");
                    html.AppendLine("<h4>Terms & Conditions:</h4>");
                    html.AppendLine($"<p>{invoice.Terms}</p>");
                    html.AppendLine("</div>");
                }

                if (!string.IsNullOrEmpty(invoice.Notes))
                {
                    html.AppendLine("<div>");
                    html.AppendLine("<h4>Notes:</h4>");
                    html.AppendLine($"<p>{invoice.Notes}</p>");
                    html.AppendLine("</div>");
                }
                
                html.AppendLine("</div>");
            }

            html.AppendLine("</body>");
            html.AppendLine("</html>");

            return Result<string>.Success(html.ToString());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating HTML for invoice {InvoiceId}", invoiceId);
            return Result<string>.Failure("An error occurred while generating the HTML");
        }
    }
}

using Microsoft.EntityFrameworkCore;
using ERPSystem.Server.Data;
using ERPSystem.Server.Models;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Sales;
using AutoMapper;

namespace ERPSystem.Server.Services.Implementations;

public class InvoiceService : IInvoiceService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<InvoiceService> _logger;
    private readonly IMapper _mapper;

    public InvoiceService(ApplicationDbContext context, ILogger<InvoiceService> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<Result<PagedResult<InvoiceDto>>> GetInvoicesAsync(InvoiceQueryParameters parameters)
    {
        try
        {
            var query = _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.SalesOrder)
                .Include(i => i.InvoiceItems.Where(ii => !ii.IsDeleted))
                    .ThenInclude(ii => ii.Product)
                .Where(i => !i.IsDeleted);

            // Apply filters
            if (parameters.CustomerId.HasValue)
                query = query.Where(i => i.CustomerId == parameters.CustomerId.Value);

            if (parameters.SalesOrderId.HasValue)
                query = query.Where(i => i.SalesOrderId == parameters.SalesOrderId.Value);

            if (parameters.Status.HasValue)
                query = query.Where(i => i.Status == parameters.Status.Value);

            if (parameters.InvoiceDateFrom.HasValue)
                query = query.Where(i => i.InvoiceDate >= parameters.InvoiceDateFrom.Value);

            if (parameters.InvoiceDateTo.HasValue)
                query = query.Where(i => i.InvoiceDate <= parameters.InvoiceDateTo.Value);

            if (parameters.DueDateFrom.HasValue)
                query = query.Where(i => i.DueDate >= parameters.DueDateFrom.Value);

            if (parameters.DueDateTo.HasValue)
                query = query.Where(i => i.DueDate <= parameters.DueDateTo.Value);

            if (!string.IsNullOrWhiteSpace(parameters.InvoiceNumber))
                query = query.Where(i => i.InvoiceNumber.Contains(parameters.InvoiceNumber));

            if (!string.IsNullOrWhiteSpace(parameters.CustomerName))
                query = query.Where(i => i.Customer.Name.Contains(parameters.CustomerName));

            if (parameters.IsOverdue.HasValue && parameters.IsOverdue.Value)
                query = query.Where(i => i.DueDate < DateTime.UtcNow && i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled && i.Status != InvoiceStatus.Refunded);

            // Apply sorting
            query = parameters.SortBy?.ToLower() switch
            {
                "invoicenumber" => parameters.SortDescending ? query.OrderByDescending(i => i.InvoiceNumber) : query.OrderBy(i => i.InvoiceNumber),
                "customername" => parameters.SortDescending ? query.OrderByDescending(i => i.Customer.Name) : query.OrderBy(i => i.Customer.Name),
                "status" => parameters.SortDescending ? query.OrderByDescending(i => i.Status) : query.OrderBy(i => i.Status),
                "totalamount" => parameters.SortDescending ? query.OrderByDescending(i => i.TotalAmount) : query.OrderBy(i => i.TotalAmount),
                "duedate" => parameters.SortDescending ? query.OrderByDescending(i => i.DueDate) : query.OrderBy(i => i.DueDate),
                _ => parameters.SortDescending ? query.OrderByDescending(i => i.InvoiceDate) : query.OrderBy(i => i.InvoiceDate)
            };

            var totalCount = await query.CountAsync();
            var invoices = await query
                .Skip((parameters.Page - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var invoiceDtos = invoices.Select(i => MapToInvoiceDto(i)).ToList();

            var pagedResult = new PagedResult<InvoiceDto>
            {
                Items = invoiceDtos,
                TotalCount = totalCount,
                CurrentPage = parameters.Page,
                PageSize = parameters.PageSize
            };

            return Result<PagedResult<InvoiceDto>>.Success(pagedResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving invoices");
            return Result<PagedResult<InvoiceDto>>.Failure("An error occurred while retrieving invoices");
        }
    }

    public async Task<Result<InvoiceDto>> GetInvoiceByIdAsync(Guid id)
    {
        try
        {
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.SalesOrder)
                .Include(i => i.InvoiceItems.Where(ii => !ii.IsDeleted))
                    .ThenInclude(ii => ii.Product)
                .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

            if (invoice == null)
            {
                return Result<InvoiceDto>.Failure("Invoice not found");
            }

            var invoiceDto = MapToInvoiceDto(invoice);
            return Result<InvoiceDto>.Success(invoiceDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving invoice with ID: {InvoiceId}", id);
            return Result<InvoiceDto>.Failure("An error occurred while retrieving the invoice");
        }
    }

    public async Task<Result<List<InvoiceDto>>> GetInvoicesBySalesOrderAsync(Guid salesOrderId)
    {
        try
        {
            var invoices = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.SalesOrder)
                .Include(i => i.InvoiceItems.Where(ii => !ii.IsDeleted))
                    .ThenInclude(ii => ii.Product)
                .Where(i => i.SalesOrderId == salesOrderId && !i.IsDeleted)
                .OrderByDescending(i => i.InvoiceDate)
                .ToListAsync();

            var invoiceDtos = invoices.Select(i => MapToInvoiceDto(i)).ToList();
            return Result<List<InvoiceDto>>.Success(invoiceDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving invoices for sales order ID: {SalesOrderId}", salesOrderId);
            return Result<List<InvoiceDto>>.Failure("An error occurred while retrieving invoices for the sales order");
        }
    }

    public async Task<Result<PagedResult<InvoiceDto>>> GetInvoicesByCustomerAsync(Guid customerId, int page = 1, int pageSize = 10)
    {
        try
        {
            var query = _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.SalesOrder)
                .Include(i => i.InvoiceItems.Where(ii => !ii.IsDeleted))
                    .ThenInclude(ii => ii.Product)
                .Where(i => i.CustomerId == customerId && !i.IsDeleted)
                .OrderByDescending(i => i.InvoiceDate);

            var totalCount = await query.CountAsync();
            var invoices = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var invoiceDtos = invoices.Select(i => MapToInvoiceDto(i)).ToList();

            var pagedResult = new PagedResult<InvoiceDto>
            {
                Items = invoiceDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };

            return Result<PagedResult<InvoiceDto>>.Success(pagedResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving invoices for customer ID: {CustomerId}", customerId);
            return Result<PagedResult<InvoiceDto>>.Failure("An error occurred while retrieving customer invoices");
        }
    }

    public async Task<Result<InvoiceDto>> CreateInvoiceAsync(InvoiceCreateDto createDto, string generatedByUserId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Validate sales order exists
            var salesOrder = await _context.SalesOrders
                .Include(so => so.Customer)
                .Include(so => so.SalesOrderItems.Where(soi => !soi.IsDeleted))
                    .ThenInclude(soi => soi.Product)
                .FirstOrDefaultAsync(so => so.Id == createDto.SalesOrderId && !so.IsDeleted);

            if (salesOrder == null)
            {
                return Result<InvoiceDto>.Failure("Sales order not found");
            }

            // Calculate totals
            var totalsResult = await CalculateInvoiceTotalsAsync(createDto.InvoiceItems, createDto.TaxAmount, createDto.DiscountAmount);
            if (!totalsResult.IsSuccess)
            {
                return Result<InvoiceDto>.Failure(totalsResult.Error!);
            }

            var invoiceNumberResult = await GenerateInvoiceNumberAsync();
            if (!invoiceNumberResult.IsSuccess)
            {
                return Result<InvoiceDto>.Failure("Failed to generate invoice number");
            }

            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                InvoiceNumber = invoiceNumberResult.Data!,
                SalesOrderId = createDto.SalesOrderId,
                CustomerId = salesOrder.CustomerId,
                Status = InvoiceStatus.Draft,
                InvoiceDate = DateTime.UtcNow,
                DueDate = createDto.DueDate,
                SubTotal = totalsResult.Data!.SubTotal,
                TaxAmount = createDto.TaxAmount,
                DiscountAmount = createDto.DiscountAmount,
                TotalAmount = totalsResult.Data.TotalAmount,
                PaidAmount = 0,
                BalanceAmount = totalsResult.Data.TotalAmount,
                Notes = createDto.Notes,
                Terms = createDto.Terms,
                GeneratedByUserId = generatedByUserId
            };

            _context.Invoices.Add(invoice);

            // Create invoice items
            foreach (var itemDto in createDto.InvoiceItems)
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == itemDto.ProductId && !p.IsDeleted);
                if (product == null)
                {
                    return Result<InvoiceDto>.Failure($"Product with ID {itemDto.ProductId} not found");
                }

                var invoiceItem = new InvoiceItem
                {
                    Id = Guid.NewGuid(),
                    InvoiceId = invoice.Id,
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice,
                    LineTotal = itemDto.Quantity * itemDto.UnitPrice,
                    Description = itemDto.Description ?? product.Name
                };

                _context.InvoiceItems.Add(invoiceItem);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Invoice created successfully. Invoice Number: {InvoiceNumber}, Sales Order ID: {SalesOrderId}", 
                invoice.InvoiceNumber, createDto.SalesOrderId);

            var result = await GetInvoiceByIdAsync(invoice.Id);
            return result;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error creating invoice for sales order ID: {SalesOrderId}", createDto.SalesOrderId);
            return Result<InvoiceDto>.Failure("An error occurred while creating the invoice");
        }
    }

    public async Task<Result<InvoiceDto>> CreateInvoiceFromSalesOrderAsync(Guid salesOrderId, string generatedByUserId, DateTime? dueDate = null)
    {
        try
        {
            var salesOrder = await _context.SalesOrders
                .Include(so => so.Customer)
                .Include(so => so.SalesOrderItems.Where(soi => !soi.IsDeleted))
                    .ThenInclude(soi => soi.Product)
                .FirstOrDefaultAsync(so => so.Id == salesOrderId && !so.IsDeleted);

            if (salesOrder == null)
            {
                return Result<InvoiceDto>.Failure("Sales order not found");
            }

            // Check if invoice already exists
            var existingInvoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.SalesOrderId == salesOrderId && !i.IsDeleted);

            if (existingInvoice != null)
            {
                return Result<InvoiceDto>.Failure("Invoice already exists for this sales order");
            }

            var invoiceItems = salesOrder.SalesOrderItems.Select(soi => new InvoiceItemCreateDto
            {
                ProductId = soi.ProductId,
                Quantity = soi.Quantity,
                UnitPrice = soi.UnitPriceAtTimeOfOrder,
                Description = soi.Product?.Name
            }).ToList();

            var createDto = new InvoiceCreateDto
            {
                SalesOrderId = salesOrderId,
                DueDate = dueDate ?? DateTime.UtcNow.AddDays(30),
                TaxAmount = 0,
                DiscountAmount = 0,
                Terms = "Payment due within 30 days of invoice date",
                InvoiceItems = invoiceItems
            };

            return await CreateInvoiceAsync(createDto, generatedByUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invoice from sales order ID: {SalesOrderId}", salesOrderId);
            return Result<InvoiceDto>.Failure("An error occurred while creating the invoice from sales order");
        }
    }

    public async Task<Result<InvoiceDto>> UpdateInvoiceAsync(Guid id, InvoiceUpdateDto updateDto, string updatedByUserId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var invoice = await _context.Invoices
                .Include(i => i.InvoiceItems.Where(ii => !ii.IsDeleted))
                .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

            if (invoice == null)
            {
                return Result<InvoiceDto>.Failure("Invoice not found");
            }

            var canEditResult = await CanEditInvoiceAsync(id);
            if (!canEditResult.IsSuccess || !canEditResult.Data)
            {
                return Result<InvoiceDto>.Failure("Invoice cannot be edited in its current status");
            }

            // Calculate new totals
            var totalsResult = await CalculateInvoiceTotalsFromUpdateDtoAsync(updateDto.InvoiceItems, updateDto.TaxAmount, updateDto.DiscountAmount);
            if (!totalsResult.IsSuccess)
            {
                return Result<InvoiceDto>.Failure(totalsResult.Error!);
            }

            // Update invoice
            invoice.DueDate = updateDto.DueDate;
            invoice.TaxAmount = updateDto.TaxAmount;
            invoice.DiscountAmount = updateDto.DiscountAmount;
            invoice.SubTotal = totalsResult.Data!.SubTotal;
            invoice.TotalAmount = totalsResult.Data.TotalAmount;
            invoice.BalanceAmount = totalsResult.Data.TotalAmount - invoice.PaidAmount;
            invoice.Notes = updateDto.Notes;
            invoice.Terms = updateDto.Terms;
            invoice.UpdatedAt = DateTime.UtcNow;

            // Update invoice items
            var existingItems = invoice.InvoiceItems.ToList();
            foreach (var existingItem in existingItems)
            {
                var updateItem = updateDto.InvoiceItems.FirstOrDefault(i => i.Id == existingItem.Id);
                if (updateItem == null)
                {
                    // Item removed
                    existingItem.IsDeleted = true;
                    existingItem.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // Update existing item
                    existingItem.ProductId = updateItem.ProductId;
                    existingItem.Quantity = updateItem.Quantity;
                    existingItem.UnitPrice = updateItem.UnitPrice;
                    existingItem.LineTotal = updateItem.Quantity * updateItem.UnitPrice;
                    existingItem.Description = updateItem.Description;
                    existingItem.UpdatedAt = DateTime.UtcNow;
                }
            }

            // Add new items
            foreach (var itemDto in updateDto.InvoiceItems.Where(i => !i.Id.HasValue))
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == itemDto.ProductId && !p.IsDeleted);
                if (product == null)
                {
                    return Result<InvoiceDto>.Failure($"Product with ID {itemDto.ProductId} not found");
                }

                var invoiceItem = new InvoiceItem
                {
                    Id = Guid.NewGuid(),
                    InvoiceId = invoice.Id,
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice,
                    LineTotal = itemDto.Quantity * itemDto.UnitPrice,
                    Description = itemDto.Description ?? product.Name
                };

                _context.InvoiceItems.Add(invoiceItem);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Invoice updated successfully. Invoice ID: {InvoiceId}", id);

            var result = await GetInvoiceByIdAsync(id);
            return result;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error updating invoice with ID: {InvoiceId}", id);
            return Result<InvoiceDto>.Failure("An error occurred while updating the invoice");
        }
    }

    public async Task<Result<InvoiceDto>> UpdateInvoiceStatusAsync(Guid id, InvoiceStatusUpdateDto statusUpdateDto, string updatedByUserId)
    {
        try
        {
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

            if (invoice == null)
            {
                return Result<InvoiceDto>.Failure("Invoice not found");
            }

            // Validate status transition
            if (!IsValidStatusTransition(invoice.Status, statusUpdateDto.Status))
            {
                return Result<InvoiceDto>.Failure($"Cannot change status from {invoice.Status} to {statusUpdateDto.Status}");
            }

            invoice.Status = statusUpdateDto.Status;
            invoice.UpdatedAt = DateTime.UtcNow;

            if (statusUpdateDto.Status == InvoiceStatus.Paid && statusUpdateDto.PaidDate.HasValue)
            {
                invoice.PaidDate = statusUpdateDto.PaidDate;
                if (statusUpdateDto.PaidAmount.HasValue)
                {
                    invoice.PaidAmount = statusUpdateDto.PaidAmount.Value;
                    invoice.BalanceAmount = invoice.TotalAmount - invoice.PaidAmount;
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Invoice status updated successfully. Invoice ID: {InvoiceId}, New Status: {Status}", 
                id, statusUpdateDto.Status);

            var result = await GetInvoiceByIdAsync(id);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating invoice status for ID: {InvoiceId}", id);
            return Result<InvoiceDto>.Failure("An error occurred while updating the invoice status");
        }
    }

    public async Task<Result<InvoiceDto>> RecordPaymentAsync(Guid id, InvoicePaymentDto paymentDto, string processedByUserId)
    {
        try
        {
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

            if (invoice == null)
            {
                return Result<InvoiceDto>.Failure("Invoice not found");
            }

            if (invoice.Status == InvoiceStatus.Paid)
            {
                return Result<InvoiceDto>.Failure("Invoice is already fully paid");
            }

            if (invoice.Status == InvoiceStatus.Cancelled || invoice.Status == InvoiceStatus.Refunded)
            {
                return Result<InvoiceDto>.Failure("Cannot record payment for cancelled or refunded invoice");
            }

            var newPaidAmount = invoice.PaidAmount + paymentDto.PaymentAmount;
            if (newPaidAmount > invoice.TotalAmount)
            {
                return Result<InvoiceDto>.Failure("Payment amount exceeds invoice total");
            }

            invoice.PaidAmount = newPaidAmount;
            invoice.BalanceAmount = invoice.TotalAmount - invoice.PaidAmount;
            invoice.PaidDate = paymentDto.PaymentDate;
            invoice.UpdatedAt = DateTime.UtcNow;

            // Update status based on payment
            if (invoice.BalanceAmount <= 0)
            {
                invoice.Status = InvoiceStatus.Paid;
            }
            else if (invoice.PaidAmount > 0)
            {
                invoice.Status = InvoiceStatus.PartiallyPaid;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Payment recorded successfully. Invoice ID: {InvoiceId}, Payment Amount: {PaymentAmount}", 
                id, paymentDto.PaymentAmount);

            var result = await GetInvoiceByIdAsync(id);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording payment for invoice ID: {InvoiceId}", id);
            return Result<InvoiceDto>.Failure("An error occurred while recording the payment");
        }
    }

    public async Task<Result<InvoiceDto>> MarkInvoiceAsSentAsync(Guid id, string sentByUserId)
    {
        try
        {
            var statusUpdateDto = new InvoiceStatusUpdateDto
            {
                Status = InvoiceStatus.Sent
            };

            return await UpdateInvoiceStatusAsync(id, statusUpdateDto, sentByUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking invoice as sent for ID: {InvoiceId}", id);
            return Result<InvoiceDto>.Failure("An error occurred while marking the invoice as sent");
        }
    }

    public async Task<Result<InvoiceDto>> CancelInvoiceAsync(Guid id, string cancelledByUserId, string? reason = null)
    {
        try
        {
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

            if (invoice == null)
            {
                return Result<InvoiceDto>.Failure("Invoice not found");
            }

            var canCancelResult = await CanCancelInvoiceAsync(id);
            if (!canCancelResult.IsSuccess || !canCancelResult.Data)
            {
                return Result<InvoiceDto>.Failure("Invoice cannot be cancelled in its current status");
            }

            invoice.Status = InvoiceStatus.Cancelled;
            invoice.UpdatedAt = DateTime.UtcNow;
            
            if (!string.IsNullOrWhiteSpace(reason))
            {
                invoice.Notes = string.IsNullOrWhiteSpace(invoice.Notes) 
                    ? $"Cancelled: {reason}" 
                    : $"{invoice.Notes}\nCancelled: {reason}";
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Invoice cancelled successfully. Invoice ID: {InvoiceId}", id);

            var result = await GetInvoiceByIdAsync(id);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling invoice with ID: {InvoiceId}", id);
            return Result<InvoiceDto>.Failure("An error occurred while cancelling the invoice");
        }
    }

    public async Task<Result<bool>> DeleteInvoiceAsync(Guid id)
    {
        try
        {
            var invoice = await _context.Invoices
                .Include(i => i.InvoiceItems)
                .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

            if (invoice == null)
            {
                return Result<bool>.Failure("Invoice not found");
            }

            var canEditResult = await CanEditInvoiceAsync(id);
            if (!canEditResult.IsSuccess || !canEditResult.Data)
            {
                return Result<bool>.Failure("Invoice cannot be deleted in its current status");
            }

            invoice.IsDeleted = true;
            invoice.UpdatedAt = DateTime.UtcNow;

            // Soft delete invoice items
            foreach (var item in invoice.InvoiceItems)
            {
                item.IsDeleted = true;
                item.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Invoice deleted successfully. Invoice ID: {InvoiceId}", id);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting invoice with ID: {InvoiceId}", id);
            return Result<bool>.Failure("An error occurred while deleting the invoice");
        }
    }

    public async Task<Result<PagedResult<InvoiceDto>>> GetOverdueInvoicesAsync(int page = 1, int pageSize = 10)
    {
        try
        {
            var query = _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.SalesOrder)
                .Include(i => i.InvoiceItems.Where(ii => !ii.IsDeleted))
                    .ThenInclude(ii => ii.Product)
                .Where(i => !i.IsDeleted 
                    && i.DueDate < DateTime.UtcNow 
                    && i.Status != InvoiceStatus.Paid 
                    && i.Status != InvoiceStatus.Cancelled 
                    && i.Status != InvoiceStatus.Refunded)
                .OrderBy(i => i.DueDate);

            var totalCount = await query.CountAsync();
            var invoices = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var invoiceDtos = invoices.Select(i => MapToInvoiceDto(i)).ToList();

            var pagedResult = new PagedResult<InvoiceDto>
            {
                Items = invoiceDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };

            return Result<PagedResult<InvoiceDto>>.Success(pagedResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving overdue invoices");
            return Result<PagedResult<InvoiceDto>>.Failure("An error occurred while retrieving overdue invoices");
        }
    }

    public async Task<Result<InvoiceStatsDto>> GetInvoiceStatsAsync(DateTime? fromDate = null, DateTime? toDate = null)
    {
        try
        {
            var query = _context.Invoices
                .Where(i => !i.IsDeleted);

            if (fromDate.HasValue)
                query = query.Where(i => i.InvoiceDate >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(i => i.InvoiceDate <= toDate.Value);

            var invoices = await query.ToListAsync();

            var stats = new InvoiceStatsDto
            {
                TotalInvoiced = invoices.Sum(i => i.TotalAmount),
                TotalPaid = invoices.Sum(i => i.PaidAmount),
                TotalOutstanding = invoices.Where(i => i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled && i.Status != InvoiceStatus.Refunded).Sum(i => i.BalanceAmount),
                TotalOverdue = invoices.Where(i => i.DueDate < DateTime.UtcNow && i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled && i.Status != InvoiceStatus.Refunded).Sum(i => i.BalanceAmount),
                TotalInvoiceCount = invoices.Count,
                PaidInvoiceCount = invoices.Count(i => i.Status == InvoiceStatus.Paid),
                OutstandingInvoiceCount = invoices.Count(i => i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled && i.Status != InvoiceStatus.Refunded),
                OverdueInvoiceCount = invoices.Count(i => i.DueDate < DateTime.UtcNow && i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled && i.Status != InvoiceStatus.Refunded),
                AverageInvoiceValue = invoices.Any() ? invoices.Average(i => i.TotalAmount) : 0,
                AveragePaymentDays = CalculateAveragePaymentDays(invoices)
            };

            return Result<InvoiceStatsDto>.Success(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating invoice statistics");
            return Result<InvoiceStatsDto>.Failure("An error occurred while calculating invoice statistics");
        }
    }

    public async Task<Result<string>> GenerateInvoiceNumberAsync()
    {
        try
        {
            var today = DateTime.UtcNow;
            var prefix = $"INV-{today:yyyyMM}-";

            // Get the last invoice number for this month
            var lastInvoice = await _context.Invoices
                .Where(i => i.InvoiceNumber.StartsWith(prefix))
                .OrderByDescending(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastInvoice != null)
            {
                var lastNumberPart = lastInvoice.InvoiceNumber.Substring(prefix.Length);
                if (int.TryParse(lastNumberPart, out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            var invoiceNumber = $"{prefix}{nextNumber:D4}";
            return Result<string>.Success(invoiceNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating invoice number");
            return Result<string>.Failure("An error occurred while generating invoice number");
        }
    }

    public async Task<Result<bool>> CanEditInvoiceAsync(Guid id)
    {
        try
        {
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

            if (invoice == null)
            {
                return Result<bool>.Failure("Invoice not found");
            }

            // Only draft invoices can be edited
            var canEdit = invoice.Status == InvoiceStatus.Draft;
            return Result<bool>.Success(canEdit);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if invoice can be edited for ID: {InvoiceId}", id);
            return Result<bool>.Failure("An error occurred while checking edit permissions");
        }
    }

    public async Task<Result<bool>> CanCancelInvoiceAsync(Guid id)
    {
        try
        {
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

            if (invoice == null)
            {
                return Result<bool>.Failure("Invoice not found");
            }

            // Draft and sent invoices can be cancelled
            var canCancel = invoice.Status == InvoiceStatus.Draft || invoice.Status == InvoiceStatus.Sent;
            return Result<bool>.Success(canCancel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if invoice can be cancelled for ID: {InvoiceId}", id);
            return Result<bool>.Failure("An error occurred while checking cancel permissions");
        }
    }

    public Task<Result<InvoiceTotalsDto>> CalculateInvoiceTotalsAsync(List<InvoiceItemCreateDto> items, decimal taxAmount = 0, decimal discountAmount = 0)
    {
        try
        {
            var subTotal = items.Sum(i => i.Quantity * i.UnitPrice);
            var totalAmount = subTotal + taxAmount - discountAmount;

            var totals = new InvoiceTotalsDto
            {
                SubTotal = subTotal,
                TaxAmount = taxAmount,
                DiscountAmount = discountAmount,
                TotalAmount = Math.Max(0, totalAmount) // Ensure total is not negative
            };

            return Task.FromResult(Result<InvoiceTotalsDto>.Success(totals));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating invoice totals");
            return Task.FromResult(Result<InvoiceTotalsDto>.Failure("An error occurred while calculating invoice totals"));
        }
    }

    public Task<Result<InvoiceTotalsDto>> CalculateInvoiceTotalsFromUpdateDtoAsync(List<InvoiceItemUpdateDto> items, decimal taxAmount = 0, decimal discountAmount = 0)
    {
        try
        {
            var subTotal = items.Sum(i => i.Quantity * i.UnitPrice);
            var totalAmount = subTotal + taxAmount - discountAmount;

            var totals = new InvoiceTotalsDto
            {
                SubTotal = subTotal,
                TaxAmount = taxAmount,
                DiscountAmount = discountAmount,
                TotalAmount = Math.Max(0, totalAmount) // Ensure total is not negative
            };

            return Task.FromResult(Result<InvoiceTotalsDto>.Success(totals));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating invoice totals from update dto");
            return Task.FromResult(Result<InvoiceTotalsDto>.Failure("An error occurred while calculating invoice totals"));
        }
    }

    #region Private Helper Methods

    private InvoiceDto MapToInvoiceDto(Invoice invoice)
    {
        return new InvoiceDto
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            SalesOrderId = invoice.SalesOrderId,
            SalesOrderReferenceNumber = invoice.SalesOrder?.ReferenceNumber ?? string.Empty,
            CustomerId = invoice.CustomerId,
            CustomerName = invoice.Customer?.Name ?? string.Empty,
            CustomerEmail = invoice.Customer?.Email ?? string.Empty,
            Status = invoice.Status,
            InvoiceDate = invoice.InvoiceDate,
            DueDate = invoice.DueDate,
            SubTotal = invoice.SubTotal,
            TaxAmount = invoice.TaxAmount,
            DiscountAmount = invoice.DiscountAmount,
            TotalAmount = invoice.TotalAmount,
            PaidAmount = invoice.PaidAmount,
            BalanceAmount = invoice.BalanceAmount,
            Notes = invoice.Notes,
            Terms = invoice.Terms,
            PaidDate = invoice.PaidDate,
            GeneratedByUserId = invoice.GeneratedByUserId,
            CreatedAt = invoice.CreatedAt,
            UpdatedAt = invoice.UpdatedAt,
            IsDeleted = invoice.IsDeleted,
            InvoiceItems = invoice.InvoiceItems?.Where(ii => !ii.IsDeleted).Select(ii => new InvoiceItemDto
            {
                Id = ii.Id,
                InvoiceId = ii.InvoiceId,
                ProductId = ii.ProductId,
                ProductName = ii.Product?.Name ?? string.Empty,
                ProductSKU = ii.Product?.SKU ?? string.Empty,
                Quantity = ii.Quantity,
                UnitPrice = ii.UnitPrice,
                LineTotal = ii.LineTotal,
                Description = ii.Description,
                CreatedAt = ii.CreatedAt,
                UpdatedAt = ii.UpdatedAt,
                IsDeleted = ii.IsDeleted
            }).ToList() ?? new List<InvoiceItemDto>()
        };
    }

    private static bool IsValidStatusTransition(InvoiceStatus currentStatus, InvoiceStatus newStatus)
    {
        return currentStatus switch
        {
            InvoiceStatus.Draft => newStatus is InvoiceStatus.Sent or InvoiceStatus.Cancelled,
            InvoiceStatus.Sent => newStatus is InvoiceStatus.Paid or InvoiceStatus.PartiallyPaid or InvoiceStatus.Overdue or InvoiceStatus.Cancelled,
            InvoiceStatus.PartiallyPaid => newStatus is InvoiceStatus.Paid or InvoiceStatus.Overdue,
            InvoiceStatus.Overdue => newStatus is InvoiceStatus.Paid or InvoiceStatus.PartiallyPaid,
            InvoiceStatus.Paid => newStatus is InvoiceStatus.Refunded,
            _ => false
        };
    }

    private static int CalculateAveragePaymentDays(List<Invoice> invoices)
    {
        var paidInvoices = invoices.Where(i => i.Status == InvoiceStatus.Paid && i.PaidDate.HasValue).ToList();
        
        if (!paidInvoices.Any())
            return 0;

        var totalDays = paidInvoices.Sum(i => (i.PaidDate!.Value - i.InvoiceDate).Days);
        return totalDays / paidInvoices.Count;
    }

    #endregion
}

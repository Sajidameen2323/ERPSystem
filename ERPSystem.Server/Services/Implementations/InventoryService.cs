using Microsoft.EntityFrameworkCore;
using ERPSystem.Server.Data;
using ERPSystem.Server.Models;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;

namespace ERPSystem.Server.Services.Implementations;

public class InvoiceService : IInvoiceService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<InvoiceService> _logger;

    public InvoiceService(ApplicationDbContext context, ILogger<InvoiceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<bool>> CreateInvoiceFromSalesOrderAsync(Guid salesOrderId, string generatedByUserId)
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
                return Result<bool>.Failure("Sales order not found");
            }

            // Check if invoice already exists
            var existingInvoice = await _context.Set<Invoice>()
                .FirstOrDefaultAsync(i => i.SalesOrderId == salesOrderId && !i.IsDeleted);

            if (existingInvoice != null)
            {
                return Result<bool>.Failure("Invoice already exists for this sales order");
            }

            var invoiceNumberResult = await GenerateInvoiceNumberAsync();
            if (!invoiceNumberResult.IsSuccess)
            {
                return Result<bool>.Failure("Failed to generate invoice number");
            }

            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                InvoiceNumber = invoiceNumberResult.Data,
                SalesOrderId = salesOrderId,
                CustomerId = salesOrder.CustomerId,
                Status = InvoiceStatus.Draft,
                InvoiceDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30), // Default 30-day terms
                SubTotal = salesOrder.TotalAmount,
                TaxAmount = 0, // Can be calculated based on tax rules
                DiscountAmount = 0,
                TotalAmount = salesOrder.TotalAmount,
                BalanceAmount = salesOrder.TotalAmount,
                GeneratedByUserId = generatedByUserId,
                Terms = "Payment due within 30 days of invoice date"
            };

            _context.Set<Invoice>().Add(invoice);

            // Create invoice items
            foreach (var orderItem in salesOrder.SalesOrderItems.Where(soi => !soi.IsDeleted))
            {
                var invoiceItem = new InvoiceItem
                {
                    Id = Guid.NewGuid(),
                    InvoiceId = invoice.Id,
                    ProductId = orderItem.ProductId,
                    Quantity = orderItem.Quantity,
                    UnitPrice = orderItem.UnitPriceAtTimeOfOrder,
                    LineTotal = orderItem.LineTotal,
                    Description = orderItem.Product?.Name
                };

                _context.Set<InvoiceItem>().Add(invoiceItem);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Invoice created successfully. Invoice Number: {InvoiceNumber}, Sales Order ID: {SalesOrderId}", 
                invoice.InvoiceNumber, salesOrderId);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invoice for sales order ID: {SalesOrderId}", salesOrderId);
            return Result<bool>.Failure("An error occurred while creating the invoice");
        }
    }

    public async Task<Result<string>> GenerateInvoiceNumberAsync()
    {
        try
        {
            var today = DateTime.UtcNow;
            var prefix = $"INV-{today:yyyyMM}-";

            // Get the last invoice number for this month
            var lastInvoice = await _context.Set<Invoice>()
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
}

public class StockMovementService : IStockMovementService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<StockMovementService> _logger;

    public StockMovementService(ApplicationDbContext context, ILogger<StockMovementService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<bool>> ProcessStockMovementAsync(Guid productId, int quantity, 
        StockMovementType movementType, string reference, string reason, string movedByUserId, string? notes = null)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == productId && !p.IsDeleted);

            if (product == null)
            {
                return Result<bool>.Failure("Product not found");
            }

            var stockBefore = product.CurrentStock;
            var movementQuantity = movementType == StockMovementType.StockOut ? -Math.Abs(quantity) : Math.Abs(quantity);
            var stockAfter = stockBefore + movementQuantity;

            // Validate stock availability for outbound movements
            if (movementType == StockMovementType.StockOut && stockAfter < 0)
            {
                return Result<bool>.Failure($"Insufficient stock. Available: {stockBefore}, Requested: {Math.Abs(quantity)}");
            }

            // Update product stock
            product.CurrentStock = stockAfter;
            product.UpdatedAt = DateTime.UtcNow;

            // Create stock movement record
            var stockMovement = new StockMovement
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                MovementType = movementType,
                Quantity = movementQuantity,
                StockBeforeMovement = stockBefore,
                StockAfterMovement = stockAfter,
                Reference = reference,
                Reason = reason,
                MovedByUserId = movedByUserId,
                Notes = notes,
                MovementDate = DateTime.UtcNow
            };

            _context.StockMovements.Add(stockMovement);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Stock movement processed successfully. Product: {ProductId}, Type: {MovementType}, Quantity: {Quantity}, Reference: {Reference}", 
                productId, movementType, movementQuantity, reference);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error processing stock movement. Product: {ProductId}, Type: {MovementType}", productId, movementType);
            return Result<bool>.Failure("An error occurred while processing stock movement");
        }
    }

    public async Task<Result<bool>> ValidateStockAvailabilityAsync(List<(Guid ProductId, int Quantity)> items)
    {
        try
        {
            foreach (var item in items)
            {
                var product = await _context.Products
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId && !p.IsDeleted);

                if (product == null)
                {
                    return Result<bool>.Failure($"Product with ID {item.ProductId} not found");
                }

                if (product.CurrentStock < item.Quantity)
                {
                    return Result<bool>.Failure($"Insufficient stock for product {product.Name}. Available: {product.CurrentStock}, Requested: {item.Quantity}");
                }
            }

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating stock availability");
            return Result<bool>.Failure("An error occurred while validating stock availability");
        }
    }

    public async Task<Result<bool>> ReserveStockAsync(List<(Guid ProductId, int Quantity)> items, string reference, string userId)
    {
        // In a full ERP system, this would create stock reservations
        // For now, we'll validate availability
        return await ValidateStockAvailabilityAsync(items);
    }

    public async Task<Result<bool>> ReleaseStockReservationAsync(List<(Guid ProductId, int Quantity)> items, string reference)
    {
        // In a full ERP system, this would release stock reservations
        return Result<bool>.Success(true);
    }
}

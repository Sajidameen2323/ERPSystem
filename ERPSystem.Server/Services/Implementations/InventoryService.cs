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

            if (string.IsNullOrEmpty(invoiceNumberResult.Data))
            {
                return Result<bool>.Failure("Generated invoice number is null or empty");
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
        StockMovementType movementType, string reference, string reason, string movedByUserId, string? notes = null, bool useExistingTransaction = false)
    {
        if (useExistingTransaction)
        {
            // When using existing transaction, don't create a new one
            return await ProcessStockMovementInternalAsync(productId, quantity, movementType, reference, reason, movedByUserId, notes);
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var result = await ProcessStockMovementInternalAsync(productId, quantity, movementType, reference, reason, movedByUserId, notes);
            
            if (result.IsSuccess)
            {
                await transaction.CommitAsync();
            }
            else
            {
                await transaction.RollbackAsync();
            }

            return result;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error processing stock movement. Product: {ProductId}, Type: {MovementType}", productId, movementType);
            return Result<bool>.Failure("An error occurred while processing stock movement");
        }
    }

    private async Task<Result<bool>> ProcessStockMovementInternalAsync(Guid productId, int quantity, 
        StockMovementType movementType, string reference, string reason, string movedByUserId, string? notes = null)
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

        _logger.LogInformation("Stock movement processed successfully. Product: {ProductId}, Type: {MovementType}, Quantity: {Quantity}, Reference: {Reference}", 
            productId, movementType, movementQuantity, reference);

        return Result<bool>.Success(true);
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

    public async Task<Result<bool>> ValidateAvailableStockAsync(List<(Guid ProductId, int Quantity)> items)
    {
        try
        {
            foreach (var item in items)
            {
                var availableStockResult = await GetAvailableStockAsync(item.ProductId);
                if (!availableStockResult.IsSuccess)
                {
                    return Result<bool>.Failure(availableStockResult.Error);
                }

                var availableStock = availableStockResult.Data;
                if (availableStock < item.Quantity)
                {
                    var product = await _context.Products
                        .FirstOrDefaultAsync(p => p.Id == item.ProductId && !p.IsDeleted);
                    
                    return Result<bool>.Failure($"Insufficient available stock for product {product?.Name ?? item.ProductId.ToString()}. Available: {availableStock}, Requested: {item.Quantity}");
                }
            }

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating available stock");
            return Result<bool>.Failure("An error occurred while validating available stock");
        }
    }

    public async Task<Result<bool>> ValidateAvailableStockForUpdateAsync(List<(Guid ProductId, int Quantity)> items, string salesOrderReferenceNumber)
    {
        try
        {
            // Group items by ProductId to handle multiple items with same product in the order
            var groupedItems = items.GroupBy(i => i.ProductId)
                .Select(g => new { ProductId = g.Key, TotalQuantity = g.Sum(i => i.Quantity) })
                .ToList();

            foreach (var groupedItem in groupedItems)
            {
                var product = await _context.Products
                    .FirstOrDefaultAsync(p => p.Id == groupedItem.ProductId && !p.IsDeleted);

                if (product == null)
                {
                    return Result<bool>.Failure($"Product with ID {groupedItem.ProductId} not found");
                }

                // Step 1: Get total reserved stock for this specific product (all active reservations)
                // Use the existing method that properly validates sales order existence
                var reservedStockResult = await GetReservedStockAsync(groupedItem.ProductId);
                if (!reservedStockResult.IsSuccess)
                {
                    return Result<bool>.Failure(reservedStockResult.Error);
                }
                var reservedStockForThisProduct = reservedStockResult.Data;

                var rawAvailableStock = product.CurrentStock - reservedStockForThisProduct;

                // Step 2: Get reserved count for this specific product in the current sales order
                var currentOrderReservedStock = await _context.StockReservations
                    .Where(sr => sr.ProductId == groupedItem.ProductId && 
                                sr.Reference == salesOrderReferenceNumber &&
                                !sr.IsReleased &&
                                !sr.IsDeleted)
                    .SumAsync(sr => sr.ReservedQuantity);

                // Step 3: Calculate available stock for this order update
                // Raw availability + current order's reserved stock = what's available for this order
                var calculatedAvailableStockForUpdate = rawAvailableStock + currentOrderReservedStock;

                // Validate if the requested quantity is available
                if (calculatedAvailableStockForUpdate < groupedItem.TotalQuantity)
                {
                    return Result<bool>.Failure($"Insufficient available stock for product {product.Name}. " +
                        $"Available: {calculatedAvailableStockForUpdate}, Requested: {groupedItem.TotalQuantity} " +
                        $"(Current Stock: {product.CurrentStock}, Total Reserved: {reservedStockForThisProduct}, Order Reserved: {currentOrderReservedStock})");
                }
            }

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating available stock for update. Sales Order Reference: {SalesOrderReference}", salesOrderReferenceNumber);
            return Result<bool>.Failure("An error occurred while validating available stock for update");
        }
    }

    public async Task<Result<bool>> ReserveStockAsync(List<(Guid ProductId, int Quantity)> items, Guid salesOrderId, string reference, string userId, string? reason = null, bool useExistingTransaction = false)
    {
        if (useExistingTransaction)
        {
            // When using existing transaction, don't create a new one
            return await ReserveStockInternalAsync(items, salesOrderId, reference, userId, reason);
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var result = await ReserveStockInternalAsync(items, salesOrderId, reference, userId, reason);
            
            if (result.IsSuccess)
            {
                await transaction.CommitAsync();
            }
            else
            {
                await transaction.RollbackAsync();
            }

            return result;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error reserving stock for reference: {Reference}", reference);
            return Result<bool>.Failure("An error occurred while reserving stock");
        }
    }

    private async Task<Result<bool>> ReserveStockInternalAsync(List<(Guid ProductId, int Quantity)> items, Guid salesOrderId, string reference, string userId, string? reason = null)
    {
        // First validate available stock
        var validationResult = await ValidateAvailableStockAsync(items);
        if (!validationResult.IsSuccess)
        {
            return validationResult;
        }

        // Check if reservation already exists for this reference
        var existingReservations = await _context.StockReservations
            .Where(sr => sr.Reference == reference && !sr.IsReleased && !sr.IsDeleted)
            .ToListAsync();

        if (existingReservations.Any())
        {
            return Result<bool>.Failure($"Stock reservation already exists for reference: {reference}");
        }

        // Create reservations
        foreach (var item in items)
        {
            var reservation = new StockReservation
            {
                Id = Guid.NewGuid(),
                ProductId = item.ProductId,
                SalesOrderId = salesOrderId,
                ReservedQuantity = item.Quantity,
                Reference = reference,
                ReservedByUserId = userId,
                ReservedAt = DateTime.UtcNow,
                Reason = reason ?? $"Stock reserved for {reference}",
                IsReleased = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.StockReservations.Add(reservation);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Stock reserved successfully for reference: {Reference}", reference);
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> ReleaseStockReservationAsync(List<(Guid ProductId, int Quantity)> items, string reference, bool useExistingTransaction = false)
    {
        if (useExistingTransaction)
        {
            // When using existing transaction, don't create a new one
            return await ReleaseStockReservationInternalAsync(items, reference);
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var result = await ReleaseStockReservationInternalAsync(items, reference);
            
            if (result.IsSuccess)
            {
                await transaction.CommitAsync();
            }
            else
            {
                await transaction.RollbackAsync();
            }

            return result;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error releasing stock reservation for reference: {Reference}", reference);
            return Result<bool>.Failure("An error occurred while releasing stock reservation");
        }
    }

    private async Task<Result<bool>> ReleaseStockReservationInternalAsync(List<(Guid ProductId, int Quantity)> items, string reference)
    {
        foreach (var item in items)
        {
            var reservations = await _context.StockReservations
                .Where(sr => sr.ProductId == item.ProductId && 
                           sr.Reference == reference && 
                           !sr.IsReleased && 
                           !sr.IsDeleted)
                .ToListAsync();

            var totalToRelease = item.Quantity;
            foreach (var reservation in reservations)
            {
                if (totalToRelease <= 0) break;

                var releaseQty = Math.Min(reservation.ReservedQuantity, totalToRelease);
                
                if (releaseQty == reservation.ReservedQuantity)
                {
                    // Release entire reservation
                    reservation.IsReleased = true;
                    reservation.ReleasedAt = DateTime.UtcNow;
                    reservation.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // Partial release - reduce reservation quantity
                    reservation.ReservedQuantity -= releaseQty;
                    reservation.UpdatedAt = DateTime.UtcNow;
                }

                totalToRelease -= releaseQty;
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Stock reservation released for reference: {Reference}", reference);
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> ReleaseAllStockReservationsByReferenceAsync(string reference, bool useExistingTransaction = false)
    {
        if (useExistingTransaction)
        {
            // When using existing transaction, don't create a new one
            return await ReleaseAllStockReservationsByReferenceInternalAsync(reference);
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var result = await ReleaseAllStockReservationsByReferenceInternalAsync(reference);
            
            if (result.IsSuccess)
            {
                await transaction.CommitAsync();
            }
            else
            {
                await transaction.RollbackAsync();
            }

            return result;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error releasing all stock reservations for reference: {Reference}", reference);
            return Result<bool>.Failure("An error occurred while releasing stock reservations");
        }
    }

    private async Task<Result<bool>> ReleaseAllStockReservationsByReferenceInternalAsync(string reference)
    {
        var reservations = await _context.StockReservations
            .Where(sr => sr.Reference == reference && !sr.IsReleased && !sr.IsDeleted)
            .ToListAsync();

        foreach (var reservation in reservations)
        {
            reservation.IsReleased = true;
            reservation.ReleasedAt = DateTime.UtcNow;
            reservation.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("All stock reservations released for reference: {Reference}", reference);
        return Result<bool>.Success(true);
    }

    public async Task<Result<int>> GetReservedStockAsync(Guid productId)
    {
        try
        {
            // Get reservations that are not released and not deleted, and verify sales order is not deleted
            var reservedStock = 0;
            var reservations = await _context.StockReservations
                .Where(sr => sr.ProductId == productId && !sr.IsReleased && !sr.IsDeleted)
                .ToListAsync();

            foreach (var reservation in reservations)
            {
                // Check if the sales order for this reservation is not deleted
                var salesOrderExists = await _context.SalesOrders
                    .AnyAsync(so => so.ReferenceNumber == reservation.Reference && !so.IsDeleted);
                
                if (salesOrderExists)
                {
                    reservedStock += reservation.ReservedQuantity;
                }
            }

            return Result<int>.Success(reservedStock);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reserved stock for product: {ProductId}", productId);
            return Result<int>.Failure("An error occurred while getting reserved stock");
        }
    }

    public async Task<Result<int>> GetAvailableStockAsync(Guid productId)
    {
        try
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == productId && !p.IsDeleted);

            if (product == null)
            {
                return Result<int>.Failure("Product not found");
            }

            var reservedStockResult = await GetReservedStockAsync(productId);
            if (!reservedStockResult.IsSuccess)
            {
                return Result<int>.Failure(reservedStockResult.Error);
            }

            var availableStock = product.CurrentStock - reservedStockResult.Data;
            return Result<int>.Success(Math.Max(0, availableStock)); // Ensure non-negative
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available stock for product: {ProductId}", productId);
            return Result<int>.Failure("An error occurred while getting available stock");
        }
    }
}

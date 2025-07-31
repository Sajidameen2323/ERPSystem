using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Server.Data;
using ERPSystem.Server.Models;
using ERPSystem.Server.DTOs.Inventory;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;

namespace ERPSystem.Server.Services.Implementations;

public class ProductService : IProductService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ProductService> _logger;

    public ProductService(ApplicationDbContext context, IMapper mapper, ILogger<ProductService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<ProductDto>> GetProductsAsync(ProductQueryParameters parameters)
    {
        try
        {
            var query = _context.Products.AsQueryable();

            // Handle status filter
            if (!string.IsNullOrWhiteSpace(parameters.StatusFilter))
            {
                switch (parameters.StatusFilter.ToLower())
                {
                    case "all":
                        query = _context.Products.IgnoreQueryFilters();
                        break;
                    case "active":
                        // Default behavior - already filtered by global query filter
                        break;
                    case "inactive":
                        query = _context.Products.IgnoreQueryFilters().Where(p => p.IsDeleted);
                        break;
                    case "lowstock":
                        // Include both out of stock and low stock items
                        query = query.Where(p => 
                            // Out of stock items (currentStock = 0)
                            p.CurrentStock == 0 ||
                            // Low stock items (currentStock > 0 but <= minimumStock)
                            (p.MinimumStock.HasValue && p.CurrentStock > 0 && p.CurrentStock <= p.MinimumStock.Value)
                        );
                        break;
                    case "outofstock":
                        query = query.Where(p => p.CurrentStock == 0);
                        break;
                }
            }
            else
            {
                // Handle legacy parameters for backward compatibility
                if (parameters.IncludeInactive)
                {
                    query = _context.Products.IgnoreQueryFilters();
                }

                // Apply legacy low stock filter - include both low stock AND out of stock items
                if (parameters.LowStockOnly == true)
                {
                    query = query.Where(p => 
                        // Out of stock items (currentStock = 0)
                        p.CurrentStock == 0 ||
                        // Low stock items (currentStock > 0 but <= minimumStock)
                        (p.MinimumStock.HasValue && p.CurrentStock > 0 && p.CurrentStock <= p.MinimumStock.Value)
                    );
                }
            }

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
            {
                var searchTerm = parameters.SearchTerm.ToLower();
                query = query.Where(p => 
                    p.Name.ToLower().Contains(searchTerm) || 
                    p.SKU.ToLower().Contains(searchTerm) ||
                    (p.Description != null && p.Description.ToLower().Contains(searchTerm)));
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(parameters.SortBy))
            {
                var isDescending = parameters.SortDirection?.ToLower() == "desc";
                
                query = parameters.SortBy.ToLower() switch
                {
                    "name" => isDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
                    "sku" => isDescending ? query.OrderByDescending(p => p.SKU) : query.OrderBy(p => p.SKU),
                    "unitprice" => isDescending ? query.OrderByDescending(p => p.UnitPrice) : query.OrderBy(p => p.UnitPrice),
                    "currentstock" => isDescending ? query.OrderByDescending(p => p.CurrentStock) : query.OrderBy(p => p.CurrentStock),
                    "createdat" => isDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
                    _ => query.OrderBy(p => p.Name)
                };
            }
            else
            {
                query = query.OrderBy(p => p.Name);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Include(p => p.StockReservations.Where(sr => !sr.IsReleased && !sr.IsDeleted))
                .Skip((parameters.Page - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var productDtos = new List<ProductDto>();
            
            // Get all sales order references from reservations in one query for efficiency
            var allReservations = items.SelectMany(p => p.StockReservations.Where(sr => !sr.IsReleased && !sr.IsDeleted)).ToList();
            var reservationReferences = allReservations.Select(r => r.Reference).Distinct().ToList();
            
            // Get all non-deleted sales orders for these references in one query
            var existingSalesOrders = await _context.SalesOrders
                .Where(so => so.ReferenceNumber != null && reservationReferences.Contains(so.ReferenceNumber) && !so.IsDeleted)
                .Select(so => so.ReferenceNumber!)
                .ToListAsync();
            
            foreach (var product in items)
            {
                var productDto = _mapper.Map<ProductDto>(product);
                
                // Calculate stock reservations (only for non-deleted sales orders)
                productDto.ReservedStock = product.StockReservations
                    .Where(sr => !sr.IsReleased && !sr.IsDeleted && existingSalesOrders.Contains(sr.Reference))
                    .Sum(sr => sr.ReservedQuantity);
                
                // Calculate available stock
                productDto.AvailableStock = Math.Max(0, product.CurrentStock - productDto.ReservedStock);
                
                productDtos.Add(productDto);
            }

            return new PagedResult<ProductDto>
            {
                Items = productDtos,
                TotalCount = totalCount,
                CurrentPage = parameters.Page,
                PageSize = parameters.PageSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products with parameters: {@Parameters}", parameters);
            return new PagedResult<ProductDto>
            {
                Items = new List<ProductDto>(),
                TotalCount = 0,
                CurrentPage = parameters.Page,
                PageSize = parameters.PageSize
            };
        }
    }

    public async Task<Result<ProductDto>> GetProductByIdAsync(Guid id)
    {
        try
        {
            var product = await _context.Products
                .Include(p => p.StockReservations.Where(sr => !sr.IsReleased && !sr.IsDeleted))
                .FirstOrDefaultAsync(p => p.Id == id);
            
            if (product == null)
            {
                return Result<ProductDto>.Failure("Product not found");
            }

            var productDto = _mapper.Map<ProductDto>(product);
            
            // Calculate stock reservations (only for non-deleted sales orders)
            var reservationReferences = product.StockReservations
                .Where(sr => !sr.IsReleased && !sr.IsDeleted)
                .Select(sr => sr.Reference)
                .Distinct()
                .ToList();
            
            var existingSalesOrders = new HashSet<string>();
            if (reservationReferences.Any())
            {
                existingSalesOrders = (await _context.SalesOrders
                    .Where(so => so.ReferenceNumber != null && reservationReferences.Contains(so.ReferenceNumber) && !so.IsDeleted)
                    .Select(so => so.ReferenceNumber!)
                    .ToListAsync()).ToHashSet();
            }
            
            productDto.ReservedStock = product.StockReservations
                .Where(sr => !sr.IsReleased && !sr.IsDeleted && existingSalesOrders.Contains(sr.Reference))
                .Sum(sr => sr.ReservedQuantity);
            
            // Calculate available stock
            productDto.AvailableStock = Math.Max(0, product.CurrentStock - productDto.ReservedStock);

            return Result<ProductDto>.Success(productDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product with ID: {ProductId}", id);
            return Result<ProductDto>.Failure("An error occurred while retrieving the product");
        }
    }

    public async Task<Result<ProductDto>> CreateProductAsync(ProductCreateDto createDto)
    {
        try
        {
            // Check if SKU is unique
            var skuExists = await _context.Products.AnyAsync(p => p.SKU == createDto.SKU);
            if (skuExists)
            {
                return Result<ProductDto>.Failure("SKU already exists");
            }

            var product = _mapper.Map<Product>(createDto);
            product.Id = Guid.NewGuid();

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            var productDto = _mapper.Map<ProductDto>(product);
            
            // Initialize stock values for new product (no reservations yet)
            productDto.ReservedStock = 0;
            productDto.AvailableStock = product.CurrentStock;
            
            _logger.LogInformation("Product created successfully with ID: {ProductId}", product.Id);
            
            return Result<ProductDto>.Success(productDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product: {@ProductData}", createDto);
            return Result<ProductDto>.Failure("An error occurred while creating the product");
        }
    }

    public async Task<Result<ProductDto>> UpdateProductAsync(Guid id, ProductUpdateDto updateDto)
    {
        try
        {
            var product = await _context.Products
                .Include(p => p.StockReservations.Where(sr => !sr.IsReleased && !sr.IsDeleted))
                .FirstOrDefaultAsync(p => p.Id == id);
            
            if (product == null)
            {
                return Result<ProductDto>.Failure("Product not found");
            }

            _mapper.Map(updateDto, product);
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var productDto = _mapper.Map<ProductDto>(product);
            
            // Calculate stock reservations (only for non-deleted sales orders)
            var reservationReferences = product.StockReservations
                .Where(sr => !sr.IsReleased && !sr.IsDeleted)
                .Select(sr => sr.Reference)
                .Distinct()
                .ToList();
            
            var existingSalesOrders = new HashSet<string>();
            if (reservationReferences.Any())
            {
                existingSalesOrders = (await _context.SalesOrders
                    .Where(so => so.ReferenceNumber != null && reservationReferences.Contains(so.ReferenceNumber) && !so.IsDeleted)
                    .Select(so => so.ReferenceNumber!)
                    .ToListAsync()).ToHashSet();
            }
            
            productDto.ReservedStock = product.StockReservations
                .Where(sr => !sr.IsReleased && !sr.IsDeleted && existingSalesOrders.Contains(sr.Reference))
                .Sum(sr => sr.ReservedQuantity);
            
            // Calculate available stock
            productDto.AvailableStock = Math.Max(0, product.CurrentStock - productDto.ReservedStock);
            
            _logger.LogInformation("Product updated successfully with ID: {ProductId}", id);
            
            return Result<ProductDto>.Success(productDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product with ID: {ProductId}", id);
            return Result<ProductDto>.Failure("An error occurred while updating the product");
        }
    }

    public async Task<Result<bool>> DeleteProductAsync(Guid id)
    {
        try
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
            
            if (product == null)
            {
                return Result<bool>.Failure("Product not found");
            }

            // Soft delete
            product.IsDeleted = true;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Product soft deleted successfully with ID: {ProductId}", id);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product with ID: {ProductId}", id);
            return Result<bool>.Failure("An error occurred while deleting the product");
        }
    }

    public async Task<Result<bool>> RestoreProductAsync(Guid id)
    {
        try
        {
            var product = await _context.Products.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id);
            
            if (product == null)
            {
                return Result<bool>.Failure("Product not found");
            }

            if (!product.IsDeleted)
            {
                return Result<bool>.Failure("Product is not deleted");
            }

            // Restore product
            product.IsDeleted = false;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Product restored successfully with ID: {ProductId}", id);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring product with ID: {ProductId}", id);
            return Result<bool>.Failure("An error occurred while restoring the product");
        }
    }

        public async Task<Result<bool>> AdjustStockAsync(Guid productId, StockAdjustmentDto adjustmentDto, string userId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId);
            
            if (product == null)
            {
                return Result<bool>.Failure("Product not found");
            }

            // Check if adjustment would result in negative stock
            var newStock = product.CurrentStock + adjustmentDto.AdjustmentQuantity;
            if (newStock < 0)
            {
                return Result<bool>.Failure("Insufficient stock for this adjustment");
            }

            // Create stock adjustment record
            var adjustment = _mapper.Map<StockAdjustment>(adjustmentDto);
            adjustment.Id = Guid.NewGuid();
            adjustment.ProductId = productId;
            adjustment.AdjustedByUserId = userId;

            _context.StockAdjustments.Add(adjustment);

            // Create stock movement record
            var stockMovement = new StockMovement
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                MovementType = adjustmentDto.AdjustmentQuantity > 0 ? StockMovementType.StockIn : StockMovementType.StockOut,
                Quantity = Math.Abs(adjustmentDto.AdjustmentQuantity),
                StockBeforeMovement = product.CurrentStock,
                StockAfterMovement = newStock,
                Reference = $"ADJ-{adjustment.Id}",
                Reason = adjustmentDto.Reason,
                MovedByUserId = userId,
                MovementDate = DateTime.UtcNow,
                Notes = "Stock movement created using the stock adjustment form"
            };

            _context.StockMovements.Add(stockMovement);

            // Update product stock
            product.CurrentStock = newStock;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Stock adjusted successfully for Product ID: {ProductId}, Adjustment: {Adjustment}, Movement ID: {MovementId}", 
                productId, adjustmentDto.AdjustmentQuantity, stockMovement.Id);
            
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error adjusting stock for product ID: {ProductId}", productId);
            return Result<bool>.Failure("An error occurred while adjusting stock");
        }
    }

    public async Task<bool> IsSkuUniqueAsync(string sku, Guid? excludeProductId = null)
    {
        try
        {
            var query = _context.Products.Where(p => p.SKU == sku);
            
            if (excludeProductId.HasValue)
            {
                query = query.Where(p => p.Id != excludeProductId.Value);
            }

            var exists = await query.AnyAsync();
            return !exists;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking SKU uniqueness for: {SKU}", sku);
            return false; // Default to false (not unique) on error for safety
        }
    }

    public async Task<PagedResult<StockAdjustmentResponseDto>> GetStockAdjustmentsAsync(Guid? productId = null, int page = 1, int pageSize = 10)
    {
        try
        {
            var query = _context.StockAdjustments
                .Include(sa => sa.Product)
                .AsQueryable();

            if (productId.HasValue)
            {
                query = query.Where(sa => sa.ProductId == productId.Value);
            }

            query = query.OrderByDescending(sa => sa.AdjustedAt);

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var adjustmentDtos = _mapper.Map<List<StockAdjustmentResponseDto>>(items);

            return new PagedResult<StockAdjustmentResponseDto>
            {
                Items = adjustmentDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stock adjustments for product ID: {ProductId}", productId);
            return new PagedResult<StockAdjustmentResponseDto>
            {
                Items = new List<StockAdjustmentResponseDto>(),
                TotalCount = 0,
                CurrentPage = page,
                PageSize = pageSize
            };
        }
    }

    public async Task<Result<ProductStockInfoDto>> GetProductStockInfoAsync(Guid productId)
    {
        try
        {
            var product = await _context.Products
                .IgnoreQueryFilters()
                .Include(p => p.StockReservations.Where(sr => !sr.IsReleased && !sr.IsDeleted))
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                return Result<ProductStockInfoDto>.Failure("Product not found");
            }

            // Calculate reserved stock (only for non-deleted sales orders)
            var reservationReferences = product.StockReservations
                .Where(sr => !sr.IsReleased && !sr.IsDeleted)
                .Select(sr => sr.Reference)
                .Distinct()
                .ToList();
            
            var existingSalesOrders = new HashSet<string>();
            if (reservationReferences.Any())
            {
                existingSalesOrders = (await _context.SalesOrders
                    .Where(so => so.ReferenceNumber != null && reservationReferences.Contains(so.ReferenceNumber) && !so.IsDeleted)
                    .Select(so => so.ReferenceNumber!)
                    .ToListAsync()).ToHashSet();
            }
            
            var activeReservations = product.StockReservations
                .Where(sr => !sr.IsReleased && !sr.IsDeleted && existingSalesOrders.Contains(sr.Reference))
                .ToList();
            
            var reservedStock = activeReservations.Sum(sr => sr.ReservedQuantity);

            // Calculate available stock
            var availableStock = Math.Max(0, product.CurrentStock - reservedStock);

            // Map to DTO
            var stockInfo = _mapper.Map<ProductStockInfoDto>(product);
            stockInfo.ReservedStock = reservedStock;
            stockInfo.AvailableStock = availableStock;

            // Map active reservations
            stockInfo.ActiveReservations = _mapper.Map<List<StockReservationDto>>(activeReservations);

            return Result<ProductStockInfoDto>.Success(stockInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stock information for product ID: {ProductId}", productId);
            return Result<ProductStockInfoDto>.Failure("An error occurred while retrieving product stock information");
        }
    }
}

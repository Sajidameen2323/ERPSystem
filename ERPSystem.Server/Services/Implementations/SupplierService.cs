using AutoMapper;
using ERPSystem.Server.Common;
using ERPSystem.Server.Data;
using ERPSystem.Server.DTOs.SupplyChain;
using ERPSystem.Server.Models;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.Server.Services.Implementations;

public class SupplierService : ISupplierService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<SupplierService> _logger;

    public SupplierService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<SupplierService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Result<PagedResult<SupplierDto>>> GetSuppliersAsync(
        string? searchTerm = null,
        bool? isActive = null,
        string? country = null,
        int page = 1,
        int pageSize = 10,
        string? sortBy = null,
        string? sortDirection = "asc")
    {
        try
        {
            var query = _context.Suppliers.AsQueryable();

            // When isActive is null, we want to get all suppliers (including soft deleted)
            // When isActive is false, we want inactive suppliers (including soft deleted)
            // When isActive is true, we want only active suppliers (excluding soft deleted)
            if (isActive == null || (isActive.HasValue && !isActive.Value))
            {
                // Include soft deleted records when getting all suppliers or inactive suppliers
                query = _context.Suppliers.IgnoreQueryFilters();
            }

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var search = searchTerm.ToLower();
                query = query.Where(s => s.Name.ToLower().Contains(search) ||
                                       s.ContactPerson.ToLower().Contains(search) ||
                                       s.Email.ToLower().Contains(search));
            }

            // Apply active filter
            if (isActive.HasValue)
            {
                if (isActive.Value)
                {
                    // For active suppliers: IsActive = true AND not soft deleted
                    query = query.Where(s => s.IsActive == true && !s.IsDeleted);
                }
                else
                {
                    // For inactive suppliers: IsActive = false OR soft deleted
                    query = query.Where(s => s.IsActive == false || s.IsDeleted);
                }
            }
            // When isActive is null, no additional filtering is needed as we want all records

            // Apply country filter
            if (!string.IsNullOrWhiteSpace(country))
            {
                query = query.Where(s => s.Country.ToLower() == country.ToLower());
            }

            // Apply sorting
            query = sortBy?.ToLower() switch
            {
                "name" => sortDirection?.ToLower() == "desc" ? query.OrderByDescending(s => s.Name) : query.OrderBy(s => s.Name),
                "contactname" => sortDirection?.ToLower() == "desc" ? query.OrderByDescending(s => s.ContactPerson) : query.OrderBy(s => s.ContactPerson),
                "email" => sortDirection?.ToLower() == "desc" ? query.OrderByDescending(s => s.Email) : query.OrderBy(s => s.Email),
                "country" => sortDirection?.ToLower() == "desc" ? query.OrderByDescending(s => s.Country) : query.OrderBy(s => s.Country),
                "createdat" => sortDirection?.ToLower() == "desc" ? query.OrderByDescending(s => s.CreatedAt) : query.OrderBy(s => s.CreatedAt),
                _ => query.OrderBy(s => s.Name)
            };

            var totalCount = await query.CountAsync();
            var suppliers = await query
                .Include(s => s.PurchaseOrders)  // Include PurchaseOrders for mapping calculations
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var supplierDtos = _mapper.Map<List<SupplierDto>>(suppliers);

            var result = new PagedResult<SupplierDto>
            {
                Items = supplierDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };

            return Result<PagedResult<SupplierDto>>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting suppliers");
            return Result<PagedResult<SupplierDto>>.Failure($"Failed to get suppliers: {ex.Message}");
        }
    }

    public async Task<Result<SupplierDto>> GetSupplierByIdAsync(Guid id)
    {
        try
        {
            // Use IgnoreQueryFilters to find supplier even if soft deleted
            var supplier = await _context.Suppliers
                .IgnoreQueryFilters()
                .Include(s => s.PurchaseOrders)  // Include PurchaseOrders for mapping calculations
                .FirstOrDefaultAsync(s => s.Id == id);

            if (supplier == null)
            {
                return Result<SupplierDto>.Failure("Supplier not found");
            }

            var supplierDto = _mapper.Map<SupplierDto>(supplier);
            return Result<SupplierDto>.Success(supplierDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting supplier {SupplierId}", id);
            return Result<SupplierDto>.Failure($"Failed to get supplier: {ex.Message}");
        }
    }

    public async Task<Result<SupplierDto>> CreateSupplierAsync(SupplierCreateDto dto)
    {
        try
        {
            // Check if email already exists (including soft deleted suppliers)
            var existingSupplier = await _context.Suppliers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.Email.ToLower() == dto.Email.ToLower());

            if (existingSupplier != null)
            {
                return Result<SupplierDto>.Failure("A supplier with this email already exists");
            }

            var supplier = _mapper.Map<Supplier>(dto);
            supplier.Id = Guid.NewGuid();

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            var supplierDto = _mapper.Map<SupplierDto>(supplier);
            _logger.LogInformation("Created supplier {SupplierId} - {SupplierName}", supplier.Id, supplier.Name);

            return Result<SupplierDto>.Success(supplierDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating supplier");
            return Result<SupplierDto>.Failure($"Failed to create supplier: {ex.Message}");
        }
    }

    public async Task<Result<SupplierDto>> UpdateSupplierAsync(Guid id, SupplierUpdateDto dto)
    {
        try
        {
            // Use IgnoreQueryFilters to find supplier even if soft deleted
            var supplier = await _context.Suppliers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.Id == id);

            if (supplier == null)
            {
                return Result<SupplierDto>.Failure("Supplier not found");
            }

            // Check if email already exists for another supplier (including soft deleted)
            var existingSupplier = await _context.Suppliers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.Email.ToLower() == dto.Email.ToLower() && s.Id != id);

            if (existingSupplier != null)
            {
                return Result<SupplierDto>.Failure("A supplier with this email already exists");
            }

            _mapper.Map(dto, supplier);
            supplier.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var supplierDto = _mapper.Map<SupplierDto>(supplier);
            _logger.LogInformation("Updated supplier {SupplierId} - {SupplierName}", supplier.Id, supplier.Name);

            return Result<SupplierDto>.Success(supplierDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating supplier {SupplierId}", id);
            return Result<SupplierDto>.Failure($"Failed to update supplier: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteSupplierAsync(Guid id)
    {
        try
        {
            // Use IgnoreQueryFilters to find supplier even if already soft deleted
            var supplier = await _context.Suppliers
                .IgnoreQueryFilters()
                .Include(s => s.ProductSuppliers)
                .Include(s => s.PurchaseOrders)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (supplier == null)
            {
                return Result<bool>.Failure("Supplier not found");
            }

            // Check if supplier has active relationships
            if (supplier.ProductSuppliers.Any() || supplier.PurchaseOrders.Any())
            {
                // Soft delete
                supplier.IsDeleted = true;
                supplier.IsActive = false;
                supplier.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Hard delete if no relationships
                _context.Suppliers.Remove(supplier);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted supplier {SupplierId} - {SupplierName}", supplier.Id, supplier.Name);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting supplier {SupplierId}", id);
            return Result<bool>.Failure($"Failed to delete supplier: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ActivateSupplierAsync(Guid id)
    {
        try
        {
            // Use IgnoreQueryFilters to find supplier even if soft deleted
            var supplier = await _context.Suppliers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.Id == id);

            if (supplier == null)
            {
                return Result<bool>.Failure("Supplier not found");
            }

            supplier.IsActive = true;
            // If supplier was soft deleted, restore it
            supplier.IsDeleted = false;
            supplier.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Activated supplier {SupplierId} - {SupplierName}", supplier.Id, supplier.Name);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating supplier {SupplierId}", id);
            return Result<bool>.Failure($"Failed to activate supplier: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeactivateSupplierAsync(Guid id)
    {
        try
        {
            // Use IgnoreQueryFilters to find supplier even if soft deleted
            var supplier = await _context.Suppliers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.Id == id);

            if (supplier == null)
            {
                return Result<bool>.Failure("Supplier not found");
            }

            supplier.IsActive = false;
            supplier.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Deactivated supplier {SupplierId} - {SupplierName}", supplier.Id, supplier.Name);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating supplier {SupplierId}", id);
            return Result<bool>.Failure($"Failed to deactivate supplier: {ex.Message}");
        }
    }

    // Product-Supplier relationship methods
    public async Task<Result<PagedResult<ProductSupplierDto>>> GetProductSuppliersAsync(
        Guid? productId = null,
        Guid? supplierId = null,
        int page = 1,
        int pageSize = 10)
    {
        try
        {
            var query = _context.ProductSuppliers
                .Include(ps => ps.Product)
                .Include(ps => ps.Supplier)
                .AsQueryable();

            if (productId.HasValue)
            {
                query = query.Where(ps => ps.ProductId == productId.Value);
            }

            if (supplierId.HasValue)
            {
                query = query.Where(ps => ps.SupplierId == supplierId.Value);
            }

            query = query.OrderBy(ps => ps.Product.Name).ThenBy(ps => ps.Supplier.Name);

            var totalCount = await query.CountAsync();
            var productSuppliers = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var productSupplierDtos = _mapper.Map<List<ProductSupplierDto>>(productSuppliers);

            var result = new PagedResult<ProductSupplierDto>
            {
                Items = productSupplierDtos,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };

            return Result<PagedResult<ProductSupplierDto>>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product suppliers");
            return Result<PagedResult<ProductSupplierDto>>.Failure($"Failed to get product suppliers: {ex.Message}");
        }
    }

    public async Task<Result<ProductSupplierDto>> CreateProductSupplierAsync(ProductSupplierCreateDto dto)
    {
        try
        {
            // Check if product exists
            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null)
            {
                return Result<ProductSupplierDto>.Failure("Product not found");
            }

            // Check if supplier exists
            var supplier = await _context.Suppliers.FindAsync(dto.SupplierId);
            if (supplier == null)
            {
                return Result<ProductSupplierDto>.Failure("Supplier not found");
            }

            // Check if relationship already exists
            var existingRelation = await _context.ProductSuppliers
                .FirstOrDefaultAsync(ps => ps.ProductId == dto.ProductId && ps.SupplierId == dto.SupplierId);

            if (existingRelation != null)
            {
                return Result<ProductSupplierDto>.Failure("This product-supplier relationship already exists");
            }

            var productSupplier = _mapper.Map<ProductSupplier>(dto);
            productSupplier.Id = Guid.NewGuid();

            _context.ProductSuppliers.Add(productSupplier);
            await _context.SaveChangesAsync();

            // Load navigation properties
            await _context.Entry(productSupplier)
                .Reference(ps => ps.Product)
                .LoadAsync();
            await _context.Entry(productSupplier)
                .Reference(ps => ps.Supplier)
                .LoadAsync();

            var productSupplierDto = _mapper.Map<ProductSupplierDto>(productSupplier);
            _logger.LogInformation("Created product-supplier relationship {ProductSupplierRelationId}", productSupplier.Id);

            return Result<ProductSupplierDto>.Success(productSupplierDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product supplier relationship");
            return Result<ProductSupplierDto>.Failure($"Failed to create product supplier relationship: {ex.Message}");
        }
    }

    public async Task<Result<ProductSupplierDto>> UpdateProductSupplierAsync(Guid id, ProductSupplierUpdateDto dto)
    {
        try
        {
            var productSupplier = await _context.ProductSuppliers
                .Include(ps => ps.Product)
                .Include(ps => ps.Supplier)
                .FirstOrDefaultAsync(ps => ps.Id == id);

            if (productSupplier == null)
            {
                return Result<ProductSupplierDto>.Failure("Product supplier relationship not found");
            }

            _mapper.Map(dto, productSupplier);
            productSupplier.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var productSupplierDto = _mapper.Map<ProductSupplierDto>(productSupplier);
            _logger.LogInformation("Updated product-supplier relationship {ProductSupplierRelationId}", productSupplier.Id);

            return Result<ProductSupplierDto>.Success(productSupplierDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product supplier relationship {ProductSupplierRelationId}", id);
            return Result<ProductSupplierDto>.Failure($"Failed to update product supplier relationship: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteProductSupplierAsync(Guid id)
    {
        try
        {
            var productSupplier = await _context.ProductSuppliers
                .FirstOrDefaultAsync(ps => ps.Id == id);

            if (productSupplier == null)
            {
                return Result<bool>.Failure("Product supplier relationship not found");
            }

            _context.ProductSuppliers.Remove(productSupplier);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted product-supplier relationship {ProductSupplierRelationId}", productSupplier.Id);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product supplier relationship {ProductSupplierRelationId}", id);
            return Result<bool>.Failure($"Failed to delete product supplier relationship: {ex.Message}");
        }
    }
}

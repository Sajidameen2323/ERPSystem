using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.SupplyChain;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Services.Interfaces;

public interface ISupplierService
{
    Task<Result<PagedResult<SupplierDto>>> GetSuppliersAsync(
        string? searchTerm = null,
        bool? isActive = null,
        string? country = null,
        int page = 1,
        int pageSize = 10,
        string? sortBy = null,
        string? sortDirection = "asc");
    
    Task<Result<SupplierDto>> GetSupplierByIdAsync(Guid id);
    Task<Result<SupplierDto>> CreateSupplierAsync(SupplierCreateDto dto);
    Task<Result<SupplierDto>> UpdateSupplierAsync(Guid id, SupplierUpdateDto dto);
    Task<Result<bool>> DeleteSupplierAsync(Guid id);
    Task<Result<bool>> ActivateSupplierAsync(Guid id);
    Task<Result<bool>> DeactivateSupplierAsync(Guid id);
    
    // Product-Supplier relationships
    Task<Result<PagedResult<ProductSupplierDto>>> GetProductSuppliersAsync(
        Guid? productId = null,
        Guid? supplierId = null,
        int page = 1,
        int pageSize = 10);
    
    Task<Result<ProductSupplierDto>> CreateProductSupplierAsync(ProductSupplierCreateDto dto);
    Task<Result<ProductSupplierDto>> UpdateProductSupplierAsync(Guid id, ProductSupplierUpdateDto dto);
    Task<Result<bool>> DeleteProductSupplierAsync(Guid id);
}



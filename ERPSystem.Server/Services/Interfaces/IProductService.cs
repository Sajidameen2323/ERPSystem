using ERPSystem.Server.DTOs.Inventory;
using ERPSystem.Server.Common;

namespace ERPSystem.Server.Services.Interfaces;

public interface IProductService
{
    Task<PagedResult<ProductDto>> GetProductsAsync(ProductQueryParameters parameters);
    Task<Result<ProductDto>> GetProductByIdAsync(Guid id);
    Task<Result<ProductDto>> CreateProductAsync(ProductCreateDto createDto);
    Task<Result<ProductDto>> UpdateProductAsync(Guid id, ProductUpdateDto updateDto);
    Task<Result<bool>> DeleteProductAsync(Guid id);
    Task<Result<bool>> RestoreProductAsync(Guid id);
    Task<Result<bool>> AdjustStockAsync(Guid productId, StockAdjustmentDto adjustmentDto, string userId);
    Task<bool> IsSkuUniqueAsync(string sku, Guid? excludeProductId = null);
    Task<PagedResult<StockAdjustmentResponseDto>> GetStockAdjustmentsAsync(Guid? productId = null, int page = 1, int pageSize = 10);
    Task<Result<ProductStockInfoDto>> GetProductStockInfoAsync(Guid productId);
}

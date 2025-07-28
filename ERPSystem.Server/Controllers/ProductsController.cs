using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ERPSystem.Server.DTOs.Inventory;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;
using System.Security.Claims;

namespace ERPSystem.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Okta authentication required
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    /// <summary>
    /// Get all products with optional filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetProducts([FromQuery] ProductQueryParameters parameters)
    {
        try
        {
            var result = await _productService.GetProductsAsync(parameters);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products");
            return StatusCode(500, Result.Failure("An error occurred while retrieving products"));
        }
    }

    /// <summary>
    /// Get a specific product by ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<ActionResult<Result<ProductDto>>> GetProduct(Guid id)
    {
        try
        {
            var result = await _productService.GetProductByIdAsync(id);
            
            if (!result.IsSuccess)
            {
                return NotFound(Result<ProductDto>.Failure("Product not found"));
            }
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product with ID {ProductId}", id);
            return StatusCode(500, Result.Failure("An error occurred while retrieving the product"));
        }
    }

    /// <summary>
    /// Create a new product
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<ActionResult<Result<ProductDto>>> CreateProduct(ProductCreateDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                return BadRequest(Result.Failure(string.Join("; ", errors)));
            }

            var userId = User.Identity?.Name ?? User.FindFirst("sub")?.Value ?? "system";
            var result = await _productService.CreateProductAsync(createDto);
            
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            
            return CreatedAtAction(
                nameof(GetProduct), 
                new { id = result.Data!.Id }, 
                result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, Result.Failure("An error occurred while creating the product"));
        }
    }

    /// <summary>
    /// Update an existing product
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<ActionResult<Result<ProductDto>>> UpdateProduct(Guid id, ProductUpdateDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                return BadRequest(Result.Failure(string.Join("; ", errors)));
            }

            var userId = User.Identity?.Name ?? User.FindFirst("sub")?.Value ?? "system";
            var result = await _productService.UpdateProductAsync(id, updateDto);
            
            if (!result.IsSuccess)
            {
                if (result.Error.Contains("not found"))
                {
                    return NotFound(Result<ProductDto>.Failure("Product not found"));
                }
                return BadRequest(result);
            }
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product with ID {ProductId}", id);
            return StatusCode(500, Result.Failure("An error occurred while updating the product"));
        }
    }

    /// <summary>
    /// Delete a product (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<ActionResult<Result>> DeleteProduct(Guid id)
    {
        try
        {
            var result = await _productService.DeleteProductAsync(id);
            
            if (!result.IsSuccess)
            {
                if (result.Error.Contains("not found"))
                {
                    return NotFound(Result.Failure("Product not found"));
                }
                return BadRequest(result);
            }
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product with ID {ProductId}", id);
            return StatusCode(500, Result.Failure("An error occurred while deleting the product"));
        }
    }

    /// <summary>
    /// Restore a deleted product
    /// </summary>
    [HttpPatch("{id}/restore")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<ActionResult<Result>> RestoreProduct(Guid id)
    {
        try
        {
            var result = await _productService.RestoreProductAsync(id);
            
            if (!result.IsSuccess)
            {
                if (result.Error.Contains("not found"))
                {
                    return NotFound(Result.Failure("Product not found"));
                }
                return BadRequest(result);
            }
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring product with ID {ProductId}", id);
            return StatusCode(500, Result.Failure("An error occurred while restoring the product"));
        }
    }

    /// <summary>
    /// Adjust stock for a product
    /// </summary>
    [HttpPost("{id}/adjust-stock")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<ActionResult<Result>> AdjustStock(Guid id, StockAdjustmentDto adjustmentDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                return BadRequest(Result.Failure(string.Join("; ", errors)));
            }

            var userId = User.Identity?.Name ?? User.FindFirst("sub")?.Value ?? "system";
            var result = await _productService.AdjustStockAsync(id, adjustmentDto, userId);
            
            if (!result.IsSuccess)
            {
                if (result.Error.Contains("not found"))
                {
                    return NotFound(Result.Failure("Product not found"));
                }
                return BadRequest(result);
            }
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adjusting stock for product with ID {ProductId}", id);
            return StatusCode(500, Result.Failure("An error occurred while adjusting stock"));
        }
    }

    /// <summary>
    /// Check if SKU is unique
    /// </summary>
    [HttpGet("check-sku/{sku}")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<ActionResult<Result<bool>>> CheckSkuUniqueness(string sku, [FromQuery] Guid? excludeProductId = null)
    {
        try
        {
            var result = await _productService.IsSkuUniqueAsync(sku, excludeProductId);
            return Ok(Result<bool>.Success(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking SKU uniqueness for {SKU}", sku);
            return StatusCode(500, Result.Failure("An error occurred while checking SKU uniqueness"));
        }
    }

    /// <summary>
    /// Get stock adjustments for all products with pagination
    /// </summary>
    [HttpGet("stock-adjustments")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<ActionResult<PagedResult<StockAdjustmentResponseDto>>> GetStockAdjustments(
        [FromQuery] Guid? productId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 10;

            var result = await _productService.GetStockAdjustmentsAsync(productId, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stock adjustments");
            return StatusCode(500, Result.Failure("An error occurred while retrieving stock adjustments"));
        }
    }

    /// <summary>
    /// Get comprehensive stock information for a product including reservations
    /// </summary>
    [HttpGet("{id}/stock-info")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<ActionResult<Result<ProductStockInfoDto>>> GetProductStockInfo(Guid id)
    {
        try
        {
            var result = await _productService.GetProductStockInfoAsync(id);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product stock information");
            return StatusCode(500, Result.Failure("An error occurred while retrieving product stock information"));
        }
    }
}

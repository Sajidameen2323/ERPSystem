using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.SupplyChain;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ERPSystem.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;
    private readonly ILogger<SuppliersController> _logger;

    public SuppliersController(
        ISupplierService supplierService,
        ILogger<SuppliersController> logger)
    {
        _supplierService = supplierService;
        _logger = logger;
    }

    /// <summary>
    /// Get all suppliers with filtering, searching, and pagination
    /// </summary>
    [HttpGet]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> GetSuppliers(
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? country = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = "asc")
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 10;

        var result = await _supplierService.GetSuppliersAsync(
            searchTerm, isActive, country, page, pageSize, sortBy, sortDirection);

        if (!result.IsSuccess)
        {
            return BadRequest(Result<PagedResult<SupplierDto>>.Failure(result.Error));
        }

        return Ok(Result<PagedResult<SupplierDto>>.Success(result.Data!));
    }

    /// <summary>
    /// Get supplier by ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> GetSupplier(Guid id)
    {
        var result = await _supplierService.GetSupplierByIdAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<SupplierDto>.Failure("Supplier not found"));
            }
            return BadRequest(Result<SupplierDto>.Failure(result.Error));
        }

        return Ok(Result<SupplierDto>.Success(result.Data!));
    }

    /// <summary>
    /// Create a new supplier
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> CreateSupplier([FromBody] SupplierCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(Result<SupplierDto>.Failure(string.Join("; ", errors)));
        }

        var result = await _supplierService.CreateSupplierAsync(dto);

        if (!result.IsSuccess)
        {
            return BadRequest(Result<SupplierDto>.Failure(result.Error));
        }

        return CreatedAtAction(nameof(GetSupplier), new { id = result.Data!.Id }, 
            Result<SupplierDto>.Success(result.Data!));
    }

    /// <summary>
    /// Update supplier
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> UpdateSupplier(Guid id, [FromBody] SupplierUpdateDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(Result<SupplierDto>.Failure(string.Join("; ", errors)));
        }

        var result = await _supplierService.UpdateSupplierAsync(id, dto);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<SupplierDto>.Failure("Supplier not found"));
            }
            return BadRequest(Result<SupplierDto>.Failure(result.Error));
        }

        return Ok(Result<SupplierDto>.Success(result.Data!));
    }

    /// <summary>
    /// Delete supplier
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> DeleteSupplier(Guid id)
    {
        var result = await _supplierService.DeleteSupplierAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<bool>.Failure("Supplier not found"));
            }
            return BadRequest(Result<bool>.Failure(result.Error));
        }

        return Ok(Result<bool>.Success(true));
    }

    /// <summary>
    /// Activate supplier
    /// </summary>
    [HttpPut("{id}/activate")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> ActivateSupplier(Guid id)
    {
        var result = await _supplierService.ActivateSupplierAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<bool>.Failure("Supplier not found"));
            }
            return BadRequest(Result<bool>.Failure(result.Error));
        }

        return Ok(Result<bool>.Success(true));
    }

    /// <summary>
    /// Deactivate supplier
    /// </summary>
    [HttpPut("{id}/deactivate")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> DeactivateSupplier(Guid id)
    {
        var result = await _supplierService.DeactivateSupplierAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<bool>.Failure("Supplier not found"));
            }
            return BadRequest(Result<bool>.Failure(result.Error));
        }

        return Ok(Result<bool>.Success(true));
    }

    /// <summary>
    /// Get product-supplier relationships
    /// </summary>
    [HttpGet("product-suppliers")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> GetProductSuppliers(
        [FromQuery] Guid? productId = null,
        [FromQuery] Guid? supplierId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 10;

        var result = await _supplierService.GetProductSuppliersAsync(
            productId, supplierId, page, pageSize);

        if (!result.IsSuccess)
        {
            return BadRequest(Result<PagedResult<ProductSupplierDto>>.Failure(result.Error));
        }

        return Ok(Result<PagedResult<ProductSupplierDto>>.Success(result.Data!));
    }

    /// <summary>
    /// Create product-supplier relationship
    /// </summary>
    [HttpPost("product-suppliers")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> CreateProductSupplier([FromBody] ProductSupplierCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(Result<ProductSupplierDto>.Failure(string.Join("; ", errors)));
        }

        var result = await _supplierService.CreateProductSupplierAsync(dto);

        if (!result.IsSuccess)
        {
            return BadRequest(Result<ProductSupplierDto>.Failure(result.Error));
        }

        return Ok(Result<ProductSupplierDto>.Success(result.Data!));
    }

    /// <summary>
    /// Update product-supplier relationship
    /// </summary>
    [HttpPut("product-suppliers/{id}")]
    [Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.InventoryUser}")]
    public async Task<IActionResult> UpdateProductSupplier(Guid id, [FromBody] ProductSupplierUpdateDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(Result<ProductSupplierDto>.Failure(string.Join("; ", errors)));
        }

        var result = await _supplierService.UpdateProductSupplierAsync(id, dto);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<ProductSupplierDto>.Failure("Product-supplier relationship not found"));
            }
            return BadRequest(Result<ProductSupplierDto>.Failure(result.Error));
        }

        return Ok(Result<ProductSupplierDto>.Success(result.Data!));
    }

    /// <summary>
    /// Delete product-supplier relationship
    /// </summary>
    [HttpDelete("product-suppliers/{id}")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> DeleteProductSupplier(Guid id)
    {
        var result = await _supplierService.DeleteProductSupplierAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result<bool>.Failure("Product-supplier relationship not found"));
            }
            return BadRequest(Result<bool>.Failure(result.Error));
        }

        return Ok(Result<bool>.Success(true));
    }
}

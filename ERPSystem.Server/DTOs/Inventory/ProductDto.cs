using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.DTOs.Inventory;

public class ProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public int CurrentStock { get; set; }
    public int? MinimumStock { get; set; }
    public bool IsLowStock { get; set; } // Computed property
    public bool IsDeleted { get; set; } // Include soft delete status
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ProductCreateDto
{
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string SKU { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [Required]
    [Range(0.01, (double)decimal.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal UnitPrice { get; set; }
    
    [Required]
    [Range(0, (double)decimal.MaxValue, ErrorMessage = "Cost price must be 0 or greater")]
    public decimal CostPrice { get; set; }
    
    [Required]
    [Range(0, int.MaxValue, ErrorMessage = "Current stock must be 0 or greater")]
    public int CurrentStock { get; set; }
    
    [Range(0, int.MaxValue, ErrorMessage = "Minimum stock must be 0 or greater")]
    public int? MinimumStock { get; set; }
}

public class ProductUpdateDto
{
    [MaxLength(255)]
    public string? Name { get; set; }
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [Range(0.01, (double)decimal.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal? UnitPrice { get; set; }
    
    [Range(0, (double)decimal.MaxValue, ErrorMessage = "Cost price must be 0 or greater")]
    public decimal? CostPrice { get; set; }
    
    [Range(0, int.MaxValue, ErrorMessage = "Minimum stock must be 0 or greater")]
    public int? MinimumStock { get; set; }
}

public class StockAdjustmentDto
{
    [Required]
    public Guid ProductId { get; set; }
    
    [Required]
    [Range(-int.MaxValue, int.MaxValue, ErrorMessage = "Adjustment quantity is required")]
    public int AdjustmentQuantity { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Reason { get; set; } = string.Empty;
}

public class StockAdjustmentResponseDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public int AdjustmentQuantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string AdjustedByUserId { get; set; } = string.Empty;
    public DateTime AdjustedAt { get; set; }
}

public class ProductQueryParameters
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public string? SortBy { get; set; }
    public string? SortDirection { get; set; } = "asc";
    public bool? LowStockOnly { get; set; }
    public bool IncludeInactive { get; set; } = false; // Keep for backward compatibility
    public string? StatusFilter { get; set; } = "all"; // New parameter: all, active, inactive, lowStock, outOfStock
}

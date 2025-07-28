using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using ERPSystem.Server.Models.Enums;

namespace ERPSystem.Server.DTOs.Sales;

/// <summary>
/// DTO for displaying sales order information
/// </summary>
public class SalesOrderDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public SalesOrderStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public string OrderedByUserId { get; set; } = string.Empty;
    public string? OrderNotes { get; set; }
    public string? ReferenceNumber { get; set; }
    public DateTime? ShippedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public List<SalesOrderItemDto> OrderItems { get; set; } = new();
}

/// <summary>
/// DTO for creating a new sales order
/// </summary>
public class SalesOrderCreateDto
{
    [Required(ErrorMessage = "Customer ID is required")]
    public Guid CustomerId { get; set; }

    [StringLength(1000, ErrorMessage = "Order notes cannot exceed 1000 characters")]
    public string? OrderNotes { get; set; }

    // ReferenceNumber is now auto-generated, removed from create DTO
    // OrderedByUserId is now extracted from claims, removed from create DTO

    [Required(ErrorMessage = "At least one order item is required")]
    [MinLength(1, ErrorMessage = "At least one order item is required")]
    public List<SalesOrderItemCreateDto> OrderItems { get; set; } = new();
}

/// <summary>
/// DTO for updating an existing sales order
/// </summary>
public class SalesOrderUpdateDto
{
    [StringLength(1000, ErrorMessage = "Order notes cannot exceed 1000 characters")]
    public string? OrderNotes { get; set; }

    [StringLength(100, ErrorMessage = "Reference number cannot exceed 100 characters")]
    public string? ReferenceNumber { get; set; }

    public List<SalesOrderItemUpdateDto>? OrderItems { get; set; }
}

/// <summary>
/// DTO for updating sales order status
/// </summary>
public class SalesOrderStatusUpdateDto
{
    [Required(ErrorMessage = "Status is required")]
    public string Status { get; set; } = string.Empty;

    public DateTime? ShippedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
    
    // UpdatedByUserId is now extracted from claims, removed from DTO

    /// <summary>
    /// Converts the string status value to SalesOrderStatus enum
    /// Handles both numeric strings and enum names
    /// </summary>
    /// <returns>The converted SalesOrderStatus enum value</returns>
    /// <exception cref="ArgumentException">Thrown when the status value is invalid</exception>
    public SalesOrderStatus GetStatusEnum()
    {
        if (string.IsNullOrWhiteSpace(Status))
        {
            throw new ArgumentException("Status cannot be null or empty");
        }

        // Try to parse as numeric string first (most common case from frontend)
        if (int.TryParse(Status.Trim(), out int numericValue))
        {
            if (Enum.IsDefined(typeof(SalesOrderStatus), numericValue))
            {
                return (SalesOrderStatus)numericValue;
            }
            throw new ArgumentException($"Invalid status numeric value: {numericValue}");
        }

        // Try to parse as enum name (case insensitive)
        if (Enum.TryParse<SalesOrderStatus>(Status.Trim(), true, out SalesOrderStatus enumValue))
        {
            return enumValue;
        }

        throw new ArgumentException($"Invalid status value: '{Status}'. Valid values are 0-6 or enum names (New, Processing, Shipped, Completed, Cancelled, Returned, OnHold)");
    }

    /// <summary>
    /// Validates if the status value can be converted to a valid SalesOrderStatus enum
    /// </summary>
    /// <returns>True if valid, false otherwise</returns>
    public bool IsValidStatus()
    {
        try
        {
            GetStatusEnum();
            return true;
        }
        catch
        {
            return false;
        }
    }
}

/// <summary>
/// DTO for sales order item display
/// </summary>
public class SalesOrderItemDto
{
    public Guid Id { get; set; }
    public Guid SalesOrderId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPriceAtTimeOfOrder { get; set; }
    public decimal LineTotal { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
}

/// <summary>
/// DTO for creating a new sales order item
/// </summary>
public class SalesOrderItemCreateDto
{
    [Required(ErrorMessage = "Product ID is required")]
    public Guid ProductId { get; set; }

    [Required(ErrorMessage = "Quantity is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public int Quantity { get; set; }

    [Required(ErrorMessage = "Unit price is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal UnitPrice { get; set; }

    [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for updating a sales order item
/// </summary>
public class SalesOrderItemUpdateDto
{
    public Guid? Id { get; set; } // null for new items

    [Required(ErrorMessage = "Product ID is required")]
    public Guid ProductId { get; set; }

    [Required(ErrorMessage = "Quantity is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public int Quantity { get; set; }

    [Required(ErrorMessage = "Unit price is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal UnitPrice { get; set; }

    [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
    public string? Notes { get; set; }

    public bool IsDeleted { get; set; } = false;
}

/// <summary>
/// Query parameters for filtering and paging sales orders
/// </summary>
public class SalesOrderQueryParameters
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public string? SortBy { get; set; } = "OrderDate";
    public bool SortDescending { get; set; } = true;
    public Guid? CustomerId { get; set; }
    public SalesOrderStatus? Status { get; set; }
    public DateTime? OrderDateFrom { get; set; }
    public DateTime? OrderDateTo { get; set; }
    public bool IncludeDeleted { get; set; } = false;
    public bool OnlyInactive { get; set; } = false;
}

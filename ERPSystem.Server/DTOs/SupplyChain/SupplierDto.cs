using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.DTOs.SupplyChain;

public class SupplierDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    public string? VatNumber { get; set; }
    public string SupplierCode { get; set; } = string.Empty;
    public string? PaymentTerms { get; set; }
    public decimal? CreditLimit { get; set; }
    public decimal TotalPurchases { get; set; }
    public DateTime? LastPurchaseDate { get; set; }
    public decimal? PerformanceRating { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SupplierCreateDto
{
    [Required(ErrorMessage = "Supplier name is required")]
    [StringLength(255, ErrorMessage = "Supplier name cannot exceed 255 characters")]
    public string Name { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Contact person is required")]
    [StringLength(100, ErrorMessage = "Contact person cannot exceed 100 characters")]
    public string ContactPerson { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string Email { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Phone is required")]
    [StringLength(20, ErrorMessage = "Phone cannot exceed 20 characters")]
    public string Phone { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Address is required")]
    [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
    public string Address { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "City is required")]
    [StringLength(100, ErrorMessage = "City cannot exceed 100 characters")]
    public string City { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Country is required")]
    [StringLength(100, ErrorMessage = "Country cannot exceed 100 characters")]
    public string Country { get; set; } = string.Empty;
    
    [StringLength(20, ErrorMessage = "Postal code cannot exceed 20 characters")]
    public string? PostalCode { get; set; }
    
    [StringLength(50, ErrorMessage = "VAT number cannot exceed 50 characters")]
    public string? VatNumber { get; set; }
    
    [StringLength(100, ErrorMessage = "Payment terms cannot exceed 100 characters")]
    public string? PaymentTerms { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Credit limit must be a positive value")]
    public decimal? CreditLimit { get; set; }
}

public class SupplierUpdateDto
{
    [Required(ErrorMessage = "Supplier name is required")]
    [StringLength(255, ErrorMessage = "Supplier name cannot exceed 255 characters")]
    public string Name { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Contact person is required")]
    [StringLength(100, ErrorMessage = "Contact person cannot exceed 100 characters")]
    public string ContactPerson { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string Email { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Phone is required")]
    [StringLength(20, ErrorMessage = "Phone cannot exceed 20 characters")]
    public string Phone { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Address is required")]
    [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
    public string Address { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "City is required")]
    [StringLength(100, ErrorMessage = "City cannot exceed 100 characters")]
    public string City { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Country is required")]
    [StringLength(100, ErrorMessage = "Country cannot exceed 100 characters")]
    public string Country { get; set; } = string.Empty;
    
    [StringLength(20, ErrorMessage = "Postal code cannot exceed 20 characters")]
    public string? PostalCode { get; set; }
    
    [StringLength(50, ErrorMessage = "VAT number cannot exceed 50 characters")]
    public string? VatNumber { get; set; }
    
    [StringLength(100, ErrorMessage = "Payment terms cannot exceed 100 characters")]
    public string? PaymentTerms { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Credit limit must be a positive value")]
    public decimal? CreditLimit { get; set; }
    
    public bool IsActive { get; set; } = true;
}

public class ProductSupplierDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid SupplierId { get; set; }
    public string SupplierSKU { get; set; } = string.Empty;
    public decimal SupplierPrice { get; set; }
    public int MinimumOrderQuantity { get; set; }
    public int LeadTimeDays { get; set; }
    public bool IsPreferredSupplier { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public string? ProductName { get; set; }
    public string? SupplierName { get; set; }
}

public class ProductSupplierCreateDto
{
    [Required(ErrorMessage = "Product ID is required")]
    public Guid ProductId { get; set; }
    
    [Required(ErrorMessage = "Supplier ID is required")]
    public Guid SupplierId { get; set; }
    
    [Required(ErrorMessage = "Supplier SKU is required")]
    [StringLength(50, ErrorMessage = "Supplier SKU cannot exceed 50 characters")]
    public string SupplierSKU { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Supplier price is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Supplier price must be greater than 0")]
    public decimal SupplierPrice { get; set; }
    
    [Range(1, int.MaxValue, ErrorMessage = "Minimum order quantity must be at least 1")]
    public int MinimumOrderQuantity { get; set; } = 1;
    
    [Range(0, int.MaxValue, ErrorMessage = "Lead time days cannot be negative")]
    public int LeadTimeDays { get; set; } = 0;
    
    public bool IsPreferredSupplier { get; set; } = false;
}

public class ProductSupplierUpdateDto
{
    [Required(ErrorMessage = "Supplier SKU is required")]
    [StringLength(50, ErrorMessage = "Supplier SKU cannot exceed 50 characters")]
    public string SupplierSKU { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Supplier price is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Supplier price must be greater than 0")]
    public decimal SupplierPrice { get; set; }
    
    [Range(1, int.MaxValue, ErrorMessage = "Minimum order quantity must be at least 1")]
    public int MinimumOrderQuantity { get; set; } = 1;
    
    [Range(0, int.MaxValue, ErrorMessage = "Lead time days cannot be negative")]
    public int LeadTimeDays { get; set; } = 0;
    
    public bool IsPreferredSupplier { get; set; } = false;
    
    public bool IsActive { get; set; } = true;
}

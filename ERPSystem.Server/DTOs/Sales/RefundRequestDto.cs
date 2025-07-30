using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.DTOs.Sales;

/// <summary>
/// DTO for creating a refund request for an invoice
/// </summary>
public class RefundRequestDto
{
    /// <summary>
    /// The amount to be refunded
    /// </summary>
    [Required(ErrorMessage = "Refund amount is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Refund amount must be greater than 0")]
    public decimal RefundAmount { get; set; }

    /// <summary>
    /// The reason for the refund request
    /// </summary>
    [Required(ErrorMessage = "Refund reason is required")]
    [StringLength(500, ErrorMessage = "Refund reason cannot exceed 500 characters")]
    public string Reason { get; set; } = string.Empty;
}

using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.DTOs.Sales;

/// <summary>
/// DTO for processing a refund request (completing the refund)
/// </summary>
public class ProcessRefundDto
{
    /// <summary>
    /// The actual amount being refunded (may differ from requested amount)
    /// </summary>
    [Required(ErrorMessage = "Actual refund amount is required")]
    [Range(0, double.MaxValue, ErrorMessage = "Actual refund amount must be non-negative")]
    public decimal ActualRefundAmount { get; set; }

    /// <summary>
    /// Optional notes about the refund processing
    /// </summary>
    [StringLength(500, ErrorMessage = "Processing notes cannot exceed 500 characters")]
    public string? ProcessingNotes { get; set; }
}

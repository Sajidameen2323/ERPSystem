using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Controllers;

/// <summary>
/// Controller for managing audit logs and system activity tracking
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditController : ControllerBase
{
    private readonly IAuditService _auditService;
    private readonly ILogger<AuditController> _logger;

    public AuditController(IAuditService auditService, ILogger<AuditController> logger)
    {
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Get audit logs with pagination and filtering
    /// </summary>
    [HttpGet]
    [Authorize(Policy = Constants.Policies.AdminOnly)]
    public async Task<ActionResult<Result<PagedResult<AuditLog>>>> GetAuditLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? entityType = null,
        [FromQuery] string? activityType = null,
        [FromQuery] string? userId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? severity = null)
    {
        try
        {
            var result = await _auditService.GetAuditLogsAsync(
                page, pageSize, entityType, activityType, userId, fromDate, toDate, severity);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit logs");
            return BadRequest(Result<PagedResult<AuditLog>>.Failure("Failed to retrieve audit logs"));
        }
    }

    /// <summary>
    /// Get audit trail for a specific entity
    /// </summary>
    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<ActionResult<Result<List<AuditLog>>>> GetEntityAuditTrail(
        string entityType, 
        string entityId)
    {
        try
        {
            var result = await _auditService.GetEntityAuditTrailAsync(entityType, entityId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit trail for {EntityType} {EntityId}", entityType, entityId);
            return BadRequest(Result<List<AuditLog>>.Failure("Failed to retrieve audit trail"));
        }
    }

    /// <summary>
    /// Get audit statistics
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Policy = Constants.Policies.AdminOnly)]
    public async Task<ActionResult<Result<AuditStatsDto>>> GetAuditStats(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            var result = await _auditService.GetAuditStatsAsync(fromDate, toDate);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit statistics");
            return BadRequest(Result<AuditStatsDto>.Failure("Failed to retrieve audit statistics"));
        }
    }

    /// <summary>
    /// Manually log an activity (for system integrations)
    /// </summary>
    [HttpPost("log")]
    [Authorize(Policy = Constants.Policies.AdminOnly)]
    public async Task<ActionResult<Result<string>>> LogActivity([FromBody] LogActivityRequest request)
    {
        try
        {
            await _auditService.LogActivityAsync(
                request.ActivityType,
                request.EntityType,
                request.EntityId,
                request.Title,
                request.Description,
                request.OldValues,
                request.NewValues,
                request.Severity ?? "Info",
                request.Icon
            );

            return Ok(Result<string>.Success("Activity logged successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging activity manually");
            return BadRequest(Result<string>.Failure("Failed to log activity"));
        }
    }

    /// <summary>
    /// Archive old audit logs
    /// </summary>
    [HttpPost("archive")]
    [Authorize(Policy = Constants.Policies.AdminOnly)]
    public async Task<ActionResult<Result<int>>> ArchiveOldLogs([FromQuery] DateTime beforeDate)
    {
        try
        {
            var result = await _auditService.ArchiveOldLogsAsync(beforeDate);
            
            if (result.IsSuccess)
            {
                _logger.LogInformation("Archived {Count} audit logs before {Date}", result.Data, beforeDate);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error archiving audit logs");
            return BadRequest(Result<int>.Failure("Failed to archive audit logs"));
        }
    }
}

/// <summary>
/// Request model for manually logging activities
/// </summary>
public class LogActivityRequest
{
    public string ActivityType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public object? OldValues { get; set; }
    public object? NewValues { get; set; }
    public string? Severity { get; set; }
    public string? Icon { get; set; }
}

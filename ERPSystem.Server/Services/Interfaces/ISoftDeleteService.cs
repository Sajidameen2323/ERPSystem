using Microsoft.EntityFrameworkCore;

namespace ERPSystem.Server.Services.Interfaces;

/// <summary>
/// Interface for soft delete operations following industry standards
/// </summary>
public interface ISoftDeleteService
{
    /// <summary>
    /// Performs soft delete on an entity if it has dependent records, otherwise hard delete
    /// </summary>
    /// <typeparam name="T">Entity type</typeparam>
    /// <param name="id">Entity ID</param>
    /// <returns>Result indicating success/failure and delete type performed</returns>
    Task<SoftDeleteResult> SafeDeleteAsync<T>(Guid id) where T : class;

    /// <summary>
    /// Restores a soft deleted entity
    /// </summary>
    /// <typeparam name="T">Entity type</typeparam>
    /// <param name="id">Entity ID</param>
    /// <returns>Result indicating success/failure</returns>
    Task<bool> RestoreAsync<T>(Guid id) where T : class;

    /// <summary>
    /// Checks if an entity has dependent records that would prevent hard delete
    /// </summary>
    /// <typeparam name="T">Entity type</typeparam>
    /// <param name="id">Entity ID</param>
    /// <returns>True if has dependents, false otherwise</returns>
    Task<bool> HasDependentRecordsAsync<T>(Guid id) where T : class;

    /// <summary>
    /// Gets all soft deleted entities of a specific type
    /// </summary>
    /// <typeparam name="T">Entity type</typeparam>
    /// <returns>List of soft deleted entities</returns>
    Task<List<T>> GetSoftDeletedAsync<T>() where T : class;
}

/// <summary>
/// Result of soft delete operation
/// </summary>
public class SoftDeleteResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public SoftDeleteType DeleteType { get; set; }
}

/// <summary>
/// Type of delete operation performed
/// </summary>
public enum SoftDeleteType
{
    SoftDelete,
    HardDelete,
    Failed
}

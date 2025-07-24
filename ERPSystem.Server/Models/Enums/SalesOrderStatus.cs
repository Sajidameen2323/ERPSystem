namespace ERPSystem.Server.Models.Enums;

/// <summary>
/// Represents the various statuses a sales order can have in the ERP system workflow
/// </summary>
public enum SalesOrderStatus
{
    /// <summary>
    /// Order has been created but not yet processed
    /// </summary>
    New = 0,

    /// <summary>
    /// Order is being reviewed and prepared
    /// </summary>
    Processing = 1,

    /// <summary>
    /// Order has been shipped to the customer
    /// </summary>
    Shipped = 2,

    /// <summary>
    /// Order has been delivered and completed successfully
    /// </summary>
    Completed = 3,

    /// <summary>
    /// Order has been cancelled before completion
    /// </summary>
    Cancelled = 4,

    /// <summary>
    /// Order has been returned by the customer
    /// </summary>
    Returned = 5,

    /// <summary>
    /// Order is on hold due to payment or inventory issues
    /// </summary>
    OnHold = 6
}

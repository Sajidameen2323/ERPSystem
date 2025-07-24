/**
 * Represents the various statuses a sales order can have in the ERP system workflow
 * This enum must match the C# SalesOrderStatus enum in the backend
 */
export enum SalesOrderStatus {
  /**
   * Order has been created but not yet processed
   */
  New = 0,

  /**
   * Order is being reviewed and prepared
   */
  Processing = 1,

  /**
   * Order has been shipped to the customer
   */
  Shipped = 2,

  /**
   * Order has been delivered and completed successfully
   */
  Completed = 3,

  /**
   * Order has been cancelled before completion
   */
  Cancelled = 4,

  /**
   * Order has been returned by the customer
   */
  Returned = 5,

  /**
   * Order is on hold due to payment or inventory issues
   */
  OnHold = 6
}

/**
 * Helper function to get the display name for a sales order status
 */
export function getSalesOrderStatusDisplay(status: SalesOrderStatus): string {
  switch (status) {
    case SalesOrderStatus.New:
      return 'New';
    case SalesOrderStatus.Processing:
      return 'Processing';
    case SalesOrderStatus.Shipped:
      return 'Shipped';
    case SalesOrderStatus.Completed:
      return 'Completed';
    case SalesOrderStatus.Cancelled:
      return 'Cancelled';
    case SalesOrderStatus.Returned:
      return 'Returned';
    case SalesOrderStatus.OnHold:
      return 'On Hold';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to get the CSS class for status styling
 */
export function getSalesOrderStatusClass(status: SalesOrderStatus): string {
  switch (status) {
    case SalesOrderStatus.New:
      return 'bg-blue-100 text-blue-800';
    case SalesOrderStatus.Processing:
      return 'bg-yellow-100 text-yellow-800';
    case SalesOrderStatus.Shipped:
      return 'bg-purple-100 text-purple-800';
    case SalesOrderStatus.Completed:
      return 'bg-green-100 text-green-800';
    case SalesOrderStatus.Cancelled:
      return 'bg-red-100 text-red-800';
    case SalesOrderStatus.Returned:
      return 'bg-orange-100 text-orange-800';
    case SalesOrderStatus.OnHold:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

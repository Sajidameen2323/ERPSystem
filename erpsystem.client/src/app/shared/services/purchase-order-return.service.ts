import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  PurchaseOrderReturn,
  PurchaseOrderReturnPagedResult,
  PurchaseOrderReturnFilters,
  CreatePurchaseOrderReturnRequest,
  AvailableReturnItem,
  ApproveReturnRequest,
  CancelReturnRequest,
  ProcessReturnRequest,
  ReturnStatus,
  ReturnReason
} from '../models/purchase-order.interface';
import { Result } from '../../core/models/shared.interface';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderReturnService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `/api/purchaseorderreturns`;

  /**
   * Get paginated list of purchase order returns
   */
  getReturns(filters: PurchaseOrderReturnFilters): Observable<PurchaseOrderReturnPagedResult> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    }

    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo.toISOString());
    }

    return this.http.get<PurchaseOrderReturnPagedResult>(this.baseUrl, { params });
  }

  /**
   * Get a specific purchase order return by ID
   */
  getReturn(id: string): Observable<Result<PurchaseOrderReturn>> {
    return this.http.get<Result<PurchaseOrderReturn>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get all returns for a specific purchase order
   */
  getReturnsByPurchaseOrder(purchaseOrderId: string): Observable<Result<PurchaseOrderReturn[]>> {
    return this.http.get<Result<PurchaseOrderReturn[]>>(`${this.baseUrl}/purchase-order/${purchaseOrderId}`);
  }

  /**
   * Create a new purchase order return
   */
  createReturn(request: CreatePurchaseOrderReturnRequest): Observable<Result<PurchaseOrderReturn>> {
    return this.http.post<Result<PurchaseOrderReturn>>(this.baseUrl, request);
  }

  /**
   * Approve a purchase order return
   */
  approveReturn(id: string, request: ApproveReturnRequest): Observable<Result<PurchaseOrderReturn>> {
    return this.http.put<Result<PurchaseOrderReturn>>(`${this.baseUrl}/${id}/approve`, request);
  }

  /**
   * Cancel a purchase order return
   */
  cancelReturn(id: string, request: CancelReturnRequest): Observable<Result<PurchaseOrderReturn>> {
    return this.http.put<Result<PurchaseOrderReturn>>(`${this.baseUrl}/${id}/cancel`, request);
  }

  /**
   * Process return (mark refunds as processed)
   */
  processReturn(id: string, request: ProcessReturnRequest): Observable<Result<PurchaseOrderReturn>> {
    return this.http.put<Result<PurchaseOrderReturn>>(`${this.baseUrl}/${id}/process`, request);
  }

  /**
   * Get available items for return from a purchase order
   */
  getAvailableReturnItems(purchaseOrderId: string): Observable<Result<AvailableReturnItem[]>> {
    return this.http.get<Result<AvailableReturnItem[]>>(`${this.baseUrl}/purchase-order/${purchaseOrderId}/available-items`);
  }

  /**
   * Get return status options for dropdowns
   */
  getReturnStatusOptions() {
    return [
      { value: '', label: 'All Status' },
      { value: ReturnStatus.Pending, label: 'Pending' },
      { value: ReturnStatus.Approved, label: 'Approved' },
      { value: ReturnStatus.Processed, label: 'Processed' },
      { value: ReturnStatus.Cancelled, label: 'Cancelled' }
    ];
  }

  /**
   * Get return reason options for dropdowns
   */
  getReturnReasonOptions() {
    return [
      { value: 0, label: 'Damaged' },
      { value: 1, label: 'Defective Quality' },
      { value: 2, label: 'Wrong Item' },
      { value: 3, label: 'Excess Stock' },
      { value: 4, label: 'Not As Ordered' },
      { value: 5, label: 'Expired' },
      { value: 6, label: 'Other' }
    ];
  }

  /**
   * Get display text for return reason
   */
  getReasonDisplayText(reason: number | string): string {
    const reasonOptions = this.getReturnReasonOptions();
    const reasonValue = typeof reason === 'string' ? parseInt(reason) : reason;
    const option = reasonOptions.find(opt => opt.value === reasonValue);
    return option?.label || 'Unknown';
  }

  /**
   * Get return status badge class
   */
  getStatusBadgeClass(status: ReturnStatus): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case ReturnStatus.Pending:
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300`;
      case ReturnStatus.Approved:
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300`;
      case ReturnStatus.Processed:
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300`;
      case ReturnStatus.Cancelled:
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300`;
    }
  }

  /**
   * Get status display text
   */
  getStatusText(status: ReturnStatus): string {
    switch (status) {
      case ReturnStatus.Pending:
        return 'Pending';
      case ReturnStatus.Approved:
        return 'Approved';
      case ReturnStatus.Processed:
        return 'Processed';
      case ReturnStatus.Cancelled:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }
}

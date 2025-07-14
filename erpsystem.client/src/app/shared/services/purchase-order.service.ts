import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Result } from '../../core/models/shared.interface';
import { 
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
  PurchaseOrderQueryParameters,
  PurchaseOrderPagedResult,
  PurchaseOrderItem,
  PurchaseOrderItemUpdate,
  ReceiveItemsRequest,
  StockMovement,
  StockMovementQueryParameters,
  StockMovementPagedResult,
  PurchaseOrderStatus
} from '../models/purchase-order.interface';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private readonly apiUrl = `/api/purchaseorders`;

  constructor(private http: HttpClient) {}

  /**
   * Get purchase orders with filtering, sorting, and pagination
   */
  getPurchaseOrders(params: PurchaseOrderQueryParameters): Observable<PurchaseOrderPagedResult> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('pageSize', params.pageSize.toString());

    if (params.searchTerm) {
      httpParams = httpParams.set('searchTerm', params.searchTerm);
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.sortDirection) {
      httpParams = httpParams.set('sortDirection', params.sortDirection);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.supplierId) {
      httpParams = httpParams.set('supplierId', params.supplierId);
    }
    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate.toISOString());
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate.toISOString());
    }

    return this.http.get<PurchaseOrderPagedResult>(this.apiUrl, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        items: (response.items || []).map(item => this.mapPurchaseOrderDates(item))
      }))
    );
  }

  /**
   * Get purchase order by ID
   */
  getPurchaseOrder(id: string): Observable<PurchaseOrder> {
    return this.http.get<Result<PurchaseOrder>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return this.mapPurchaseOrderDates(response.data);
        }
        throw new Error(response.error || 'Failed to get purchase order');
      })
    );
  }

  /**
   * Create a new purchase order
   */
  createPurchaseOrder(purchaseOrder: PurchaseOrderCreate): Observable<PurchaseOrder> {
    return this.http.post<Result<PurchaseOrder>>(this.apiUrl, purchaseOrder).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return this.mapPurchaseOrderDates(response.data);
        }
        throw new Error(response.error || 'Failed to create purchase order');
      })
    );
  }

  /**
   * Update an existing purchase order
   */
  updatePurchaseOrder(id: string, purchaseOrder: PurchaseOrderUpdate): Observable<PurchaseOrder> {
    return this.http.put<Result<PurchaseOrder>>(`${this.apiUrl}/${id}`, purchaseOrder).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return this.mapPurchaseOrderDates(response.data);
        }
        throw new Error(response.error || 'Failed to update purchase order');
      })
    );
  }

  /**
   * Delete a purchase order
   */
  deletePurchaseOrder(id: string): Observable<void> {
    return this.http.delete<Result<void>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response.isSuccess) {
          throw new Error(response.error || 'Failed to delete purchase order');
        }
      })
    );
  }

  /**
   * Submit purchase order for approval
   */
  submitForApproval(id: string): Observable<void> {
    return this.http.post<Result<void>>(`${this.apiUrl}/${id}/submit`, {}).pipe(
      map(response => {
        if (!response.isSuccess) {
          throw new Error(response.error || 'Failed to submit purchase order for approval');
        }
      })
    );
  }

  /**
   * Approve a purchase order
   */
  approvePurchaseOrder(id: string): Observable<void> {
    return this.http.post<Result<void>>(`${this.apiUrl}/${id}/approve`, {}).pipe(
      map(response => {
        if (!response.isSuccess) {
          throw new Error(response.error || 'Failed to approve purchase order');
        }
      })
    );
  }

  /**
   * Cancel a purchase order
   */
  cancelPurchaseOrder(id: string): Observable<void> {
    return this.http.post<Result<void>>(`${this.apiUrl}/${id}/cancel`, {}).pipe(
      map(response => {
        if (!response.isSuccess) {
          throw new Error(response.error || 'Failed to cancel purchase order');
        }
      })
    );
  }

  /**
   * Get purchase order items
   */
  getPurchaseOrderItems(purchaseOrderId: string): Observable<PurchaseOrderItem[]> {
    return this.http.get<Result<PurchaseOrderItem[]>>(`${this.apiUrl}/${purchaseOrderId}/items`).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to get purchase order items');
      })
    );
  }

  /**
   * Update purchase order item
   */
  updatePurchaseOrderItem(purchaseOrderId: string, itemId: string, item: PurchaseOrderItemUpdate): Observable<PurchaseOrderItem> {
    return this.http.put<Result<PurchaseOrderItem>>(`${this.apiUrl}/${purchaseOrderId}/items/${itemId}`, item).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to update purchase order item');
      })
    );
  }

  /**
   * Delete purchase order item
   */
  deletePurchaseOrderItem(purchaseOrderId: string, itemId: string): Observable<void> {
    return this.http.delete<Result<void>>(`${this.apiUrl}/${purchaseOrderId}/items/${itemId}`).pipe(
      map(response => {
        if (!response.isSuccess) {
          throw new Error(response.error || 'Failed to delete purchase order item');
        }
      })
    );
  }

  /**
   * Receive items for a purchase order
   */
  receiveItems(purchaseOrderId: string, request: ReceiveItemsRequest): Observable<void> {
    return this.http.post<Result<void>>(`${this.apiUrl}/${purchaseOrderId}/receive`, request).pipe(
      map(response => {
        if (!response.isSuccess) {
          throw new Error(response.error || 'Failed to receive items');
        }
      })
    );
  }

  /**
   * Get stock movements with filtering and pagination
   */
  getStockMovements(params: StockMovementQueryParameters): Observable<StockMovementPagedResult> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('pageSize', params.pageSize.toString());

    if (params.productId) {
      httpParams = httpParams.set('productId', params.productId);
    }
    if (params.movementType) {
      httpParams = httpParams.set('movementType', params.movementType);
    }
    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate.toISOString());
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate.toISOString());
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.sortDirection) {
      httpParams = httpParams.set('sortDirection', params.sortDirection);
    }

    return this.http.get<StockMovementPagedResult>(`${this.apiUrl}/stock-movements`, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        items: (response.items || []).map(item => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
        }))
      }))
    );
  }

  /**
   * Get purchase order status options for dropdown
   */
  getStatusOptions(): { value: PurchaseOrderStatus; label: string }[] {
    return [
      { value: PurchaseOrderStatus.Draft, label: 'Draft' },
      { value: PurchaseOrderStatus.Pending, label: 'Pending Approval' },
      { value: PurchaseOrderStatus.Approved, label: 'Approved' },
      { value: PurchaseOrderStatus.PartiallyReceived, label: 'Partially Received' },
      { value: PurchaseOrderStatus.Received, label: 'Fully Received' },
      { value: PurchaseOrderStatus.Cancelled, label: 'Cancelled' }
    ];
  }

  /**
   * Get status badge class for styling
   */
  getStatusBadgeClass(status: PurchaseOrderStatus): string {
    switch (status) {
      case PurchaseOrderStatus.Draft:
        return 'bg-gray-100 text-gray-800';
      case PurchaseOrderStatus.Pending:
        return 'bg-yellow-100 text-yellow-800';
      case PurchaseOrderStatus.Approved:
        return 'bg-blue-100 text-blue-800';
      case PurchaseOrderStatus.PartiallyReceived:
        return 'bg-purple-100 text-purple-800';
      case PurchaseOrderStatus.Received:
        return 'bg-green-100 text-green-800';
      case PurchaseOrderStatus.Cancelled:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Check if purchase order can be edited
   */
  canEdit(status: PurchaseOrderStatus): boolean {
    return status === PurchaseOrderStatus.Draft;
  }

  /**
   * Check if purchase order can be submitted for approval
   */
  canSubmit(status: PurchaseOrderStatus): boolean {
    return status === PurchaseOrderStatus.Draft;
  }

  /**
   * Check if purchase order can be approved
   */
  canApprove(status: PurchaseOrderStatus): boolean {
    return status === PurchaseOrderStatus.Pending;
  }

  /**
   * Check if purchase order can be cancelled
   */
  canCancel(status: PurchaseOrderStatus): boolean {
    return status === PurchaseOrderStatus.Draft || 
           status === PurchaseOrderStatus.Pending || 
           status === PurchaseOrderStatus.Approved;
  }

  /**
   * Check if items can be received
   */
  canReceiveItems(status: PurchaseOrderStatus): boolean {
    return status === PurchaseOrderStatus.Approved || 
           status === PurchaseOrderStatus.PartiallyReceived;
  }

  /**
   * Map purchase order dates from string to Date objects
   */
  private mapPurchaseOrderDates(purchaseOrder: PurchaseOrder): PurchaseOrder {
    return {
      ...purchaseOrder,
      orderDate: purchaseOrder.orderDate ? new Date(purchaseOrder.orderDate) : new Date(),
      expectedDeliveryDate: purchaseOrder.expectedDeliveryDate ? new Date(purchaseOrder.expectedDeliveryDate) : undefined,
      actualDeliveryDate: purchaseOrder.actualDeliveryDate ? new Date(purchaseOrder.actualDeliveryDate) : undefined,
      approvedAt: purchaseOrder.approvedAt ? new Date(purchaseOrder.approvedAt) : undefined,
      createdAt: purchaseOrder.createdAt ? new Date(purchaseOrder.createdAt) : new Date(),
      updatedAt: purchaseOrder.updatedAt ? new Date(purchaseOrder.updatedAt) : new Date()
    };
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  SalesOrder, 
  SalesOrderCreateRequest, 
  SalesOrderUpdateRequest, 
  SalesOrderStatusUpdateRequest,
  SalesOrderQueryParameters, 
  SalesOrderStats,
  SalesOrderStatus
} from '../models/sales-order.model';
import { PagedResult, Result } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class SalesOrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/salesorders';

  /**
   * Get sales orders with optional filtering, sorting, and pagination
   */
  getSalesOrders(params?: SalesOrderQueryParameters): Observable<PagedResult<SalesOrder>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortDescending !== undefined) httpParams = httpParams.set('sortDescending', params.sortDescending.toString());
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.customerId) httpParams = httpParams.set('customerId', params.customerId);
      if (params.status !== undefined) httpParams = httpParams.set('status', params.status.toString());
      if (params.orderDateFrom) httpParams = httpParams.set('orderDateFrom', params.orderDateFrom.toISOString());
      if (params.orderDateTo) httpParams = httpParams.set('orderDateTo', params.orderDateTo.toISOString());
      if (params.includeDeleted !== undefined) httpParams = httpParams.set('includeDeleted', params.includeDeleted.toString());
      if (params.onlyInactive !== undefined) httpParams = httpParams.set('onlyInactive', params.onlyInactive.toString());
    }

    return this.http.get<PagedResult<SalesOrder>>(this.baseUrl, { params: httpParams });
  }

  /**
   * Get a specific sales order by ID
   */
  getSalesOrderById(id: string): Observable<SalesOrder> {
    return this.http.get<SalesOrder>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new sales order
   */
  createSalesOrder(salesOrder: SalesOrderCreateRequest): Observable<SalesOrder> {
    return this.http.post<SalesOrder>(this.baseUrl, salesOrder);
  }

  /**
   * Update an existing sales order
   */
  updateSalesOrder(id: string, salesOrder: SalesOrderUpdateRequest): Observable<SalesOrder> {
    return this.http.put<SalesOrder>(`${this.baseUrl}/${id}`, salesOrder);
  }

  /**
   * Update sales order status
   */
  updateSalesOrderStatus(id: string, statusUpdate: SalesOrderStatusUpdateRequest): Observable<SalesOrder> {
    return this.http.patch<SalesOrder>(`${this.baseUrl}/${id}/status`, statusUpdate);
  }

  /**
   * Delete a sales order (soft delete)
   */
  deleteSalesOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Restore a soft-deleted sales order
   */
  restoreSalesOrder(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/restore`, {});
  }

  /**
   * Get sales orders for a specific customer
   */
  getSalesOrdersByCustomer(customerId: string, params?: SalesOrderQueryParameters): Observable<PagedResult<SalesOrder>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortDescending !== undefined) httpParams = httpParams.set('sortDescending', params.sortDescending.toString());
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.status !== undefined) httpParams = httpParams.set('status', params.status.toString());
      if (params.orderDateFrom) httpParams = httpParams.set('orderDateFrom', params.orderDateFrom.toISOString());
      if (params.orderDateTo) httpParams = httpParams.set('orderDateTo', params.orderDateTo.toISOString());
      if (params.includeDeleted !== undefined) httpParams = httpParams.set('includeDeleted', params.includeDeleted.toString());
    }

    return this.http.get<PagedResult<SalesOrder>>(`${this.baseUrl}/customer/${customerId}`, { params: httpParams });
  }

  /**
   * Get sales order statistics
   */
  getSalesOrderStats(fromDate?: Date, toDate?: Date): Observable<SalesOrderStats> {
    let httpParams = new HttpParams();
    
    if (fromDate) httpParams = httpParams.set('fromDate', fromDate.toISOString());
    if (toDate) httpParams = httpParams.set('toDate', toDate.toISOString());

    return this.http.get<SalesOrderStats>(`${this.baseUrl}/stats`, { params: httpParams });
  }

  /**
   * Check if a sales order can be updated
   */
  canUpdateSalesOrder(id: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/${id}/can-update`);
  }
}

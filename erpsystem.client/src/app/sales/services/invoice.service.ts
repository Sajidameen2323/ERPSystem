import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Result, PagedResult } from '../../shared/models/common.model';
import { 
  Invoice, 
  CreateInvoiceRequest, 
  UpdateInvoiceRequest, 
  InvoicePaymentRequest, 
  InvoiceQueryParameters,
  InvoiceListItem,
  InvoiceStatistics,
  InvoiceStatusUpdateRequest,
  CalculateInvoiceTotalsRequest,
  InvoiceTotalsDto,
  GetInvoicesResponse,
  GetInvoiceResponse,
  CreateInvoiceResponse,
  UpdateInvoiceResponse,
  DeleteInvoiceResponse,
  InvoiceStatsResponse,
  CalculateTotalsResponse,
  GenerateNumberResponse,
  CanEditResponse,
  CanCancelResponse
} from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/invoices';

  getInvoices(parameters?: InvoiceQueryParameters): Observable<GetInvoicesResponse> {
    let params = new HttpParams();

    if (parameters) {
      if (parameters.page) {
        params = params.set('page', parameters.page.toString());
      }
      if (parameters.pageSize) {
        params = params.set('pageSize', parameters.pageSize.toString());
      }
      if (parameters.customerId) {
        params = params.set('customerId', parameters.customerId);
      }
      if (parameters.salesOrderId) {
        params = params.set('salesOrderId', parameters.salesOrderId);
      }
      if (parameters.status) {
        params = params.set('status', parameters.status);
      }
      if (parameters.invoiceDateFrom) {
        params = params.set('invoiceDateFrom', parameters.invoiceDateFrom);
      }
      if (parameters.invoiceDateTo) {
        params = params.set('invoiceDateTo', parameters.invoiceDateTo);
      }
      if (parameters.dueDateFrom) {
        params = params.set('dueDateFrom', parameters.dueDateFrom);
      }
      if (parameters.dueDateTo) {
        params = params.set('dueDateTo', parameters.dueDateTo);
      }
      if (parameters.invoiceNumber) {
        params = params.set('invoiceNumber', parameters.invoiceNumber);
      }
      if (parameters.customerName) {
        params = params.set('customerName', parameters.customerName);
      }
      if (parameters.isOverdue !== undefined) {
        params = params.set('isOverdue', parameters.isOverdue.toString());
      }
      if (parameters.sortBy) {
        params = params.set('sortBy', parameters.sortBy);
      }
      if (parameters.sortDescending !== undefined) {
        params = params.set('sortDescending', parameters.sortDescending.toString());
      }
    }

    return this.http.get<GetInvoicesResponse>(this.baseUrl, { params });
  }

  getInvoice(id: string): Observable<GetInvoiceResponse> {
    return this.http.get<GetInvoiceResponse>(`${this.baseUrl}/${id}`);
  }

  createInvoice(invoice: CreateInvoiceRequest): Observable<CreateInvoiceResponse> {
    return this.http.post<CreateInvoiceResponse>(this.baseUrl, invoice);
  }

  updateInvoice(id: string, invoice: UpdateInvoiceRequest): Observable<UpdateInvoiceResponse> {
    return this.http.put<UpdateInvoiceResponse>(`${this.baseUrl}/${id}`, invoice);
  }

  deleteInvoice(id: string): Observable<DeleteInvoiceResponse> {
    return this.http.delete<DeleteInvoiceResponse>(`${this.baseUrl}/${id}`);
  }

  recordPayment(id: string, payment: InvoicePaymentRequest): Observable<UpdateInvoiceResponse> {
    return this.http.post<UpdateInvoiceResponse>(`${this.baseUrl}/${id}/payments`, payment);
  }

  // Status and action methods
  updateInvoiceStatus(id: string, statusUpdate: InvoiceStatusUpdateRequest): Observable<UpdateInvoiceResponse> {
    return this.http.patch<UpdateInvoiceResponse>(`${this.baseUrl}/${id}/status`, statusUpdate);
  }

  markInvoiceAsSent(id: string): Observable<UpdateInvoiceResponse> {
    return this.http.patch<UpdateInvoiceResponse>(`${this.baseUrl}/${id}/mark-sent`, {});
  }

  cancelInvoice(id: string, reason?: string): Observable<UpdateInvoiceResponse> {
    return this.http.patch<UpdateInvoiceResponse>(`${this.baseUrl}/${id}/cancel`, { reason });
  }

  // Refund methods
  requestRefund(id: string, refundAmount?: number, reason?: string): Observable<UpdateInvoiceResponse> {
    return this.http.post<UpdateInvoiceResponse>(`${this.baseUrl}/${id}/request-refund`, { 
      refundAmount, 
      reason 
    });
  }

  processRefund(id: string, actualRefundAmount?: number, processingNotes?: string): Observable<UpdateInvoiceResponse> {
    return this.http.post<UpdateInvoiceResponse>(`${this.baseUrl}/${id}/process-refund`, { 
      actualRefundAmount, 
      processingNotes 
    });
  }

  // Business methods
  createInvoiceFromSalesOrder(salesOrderId: string, dueDate?: string): Observable<CreateInvoiceResponse> {
    return this.http.post<CreateInvoiceResponse>(`${this.baseUrl}/from-sales-order/${salesOrderId}`, { dueDate });
  }

  calculateInvoiceTotals(request: CalculateInvoiceTotalsRequest): Observable<CalculateTotalsResponse> {
    return this.http.post<CalculateTotalsResponse>(`${this.baseUrl}/calculate-totals`, request);
  }

  generateInvoiceNumber(): Observable<GenerateNumberResponse> {
    return this.http.get<GenerateNumberResponse>(`${this.baseUrl}/generate-number`);
  }

  // Validation methods
  canEditInvoice(id: string): Observable<CanEditResponse> {
    return this.http.get<CanEditResponse>(`${this.baseUrl}/${id}/can-edit`);
  }

  canCancelInvoice(id: string): Observable<CanCancelResponse> {
    return this.http.get<CanCancelResponse>(`${this.baseUrl}/${id}/can-cancel`);
  }

  // Statistics and reports
  getInvoiceStatistics(fromDate?: string, toDate?: string): Observable<InvoiceStatsResponse> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    
    return this.http.get<InvoiceStatsResponse>(`${this.baseUrl}/stats`, { params });
  }

  getOverdueInvoices(page: number = 1, pageSize: number = 10): Observable<GetInvoicesResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    return this.http.get<GetInvoicesResponse>(`${this.baseUrl}/overdue`, { params });
  }

  getInvoicesByCustomer(customerId: string, page: number = 1, pageSize: number = 10): Observable<GetInvoicesResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    return this.http.get<GetInvoicesResponse>(`${this.baseUrl}/customer/${customerId}`, { params });
  }

  getInvoicesBySalesOrder(salesOrderId: string): Observable<Result<Invoice[]>> {
    return this.http.get<Result<Invoice[]>>(`${this.baseUrl}/sales-order/${salesOrderId}`);
  }

  // File operations
  downloadInvoicePdf(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, { 
      responseType: 'blob'
    });
  }

  exportInvoicesToExcel(parameters?: InvoiceQueryParameters): Observable<Blob> {
    let params = new HttpParams();

    if (parameters) {
      if (parameters.customerId) {
        params = params.set('customerId', parameters.customerId);
      }
      if (parameters.status) {
        params = params.set('status', parameters.status);
      }
      if (parameters.invoiceDateFrom) {
        params = params.set('invoiceDateFrom', parameters.invoiceDateFrom);
      }
      if (parameters.invoiceDateTo) {
        params = params.set('invoiceDateTo', parameters.invoiceDateTo);
      }
    }

    return this.http.get(`${this.baseUrl}/export-excel`, { 
      params,
      responseType: 'blob'
    });
  }

  // Batch operations
  batchUpdateInvoiceStatus(invoiceIds: string[], status: string): Observable<Result<void>> {
    return this.http.post<Result<void>>(`${this.baseUrl}/batch-update-status`, { 
      invoiceIds, 
      status 
    });
  }

  batchSendInvoices(invoiceIds: string[]): Observable<Result<void>> {
    return this.http.post<Result<void>>(`${this.baseUrl}/batch-send`, { invoiceIds });
  }

  batchCancelInvoices(invoiceIds: string[], reason?: string): Observable<Result<void>> {
    return this.http.post<Result<void>>(`${this.baseUrl}/batch-cancel`, { 
      invoiceIds, 
      reason 
    });
  }
}

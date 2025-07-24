import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Customer, 
  CustomerCreateRequest, 
  CustomerUpdateRequest, 
  CustomerQueryParameters, 
  PagedResult, 
  Result 
} from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/customers';

  /**
   * Get customers with optional filtering, sorting, and pagination
   */
  getCustomers(params?: CustomerQueryParameters): Observable<Result<PagedResult<Customer>>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortDescending !== undefined) httpParams = httpParams.set('sortDescending', params.sortDescending.toString());
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.includeDeleted !== undefined) httpParams = httpParams.set('includeDeleted', params.includeDeleted.toString());
    }

    return this.http.get<Result<PagedResult<Customer>>>(this.baseUrl, { params: httpParams });
  }

  /**
   * Get a specific customer by ID
   */
  getCustomerById(id: string): Observable<Result<Customer>> {
    return this.http.get<Result<Customer>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new customer
   */
  createCustomer(customer: CustomerCreateRequest): Observable<Result<Customer>> {
    return this.http.post<Result<Customer>>(this.baseUrl, customer);
  }

  /**
   * Update an existing customer
   */
  updateCustomer(id: string, customer: CustomerUpdateRequest): Observable<Result<Customer>> {
    return this.http.put<Result<Customer>>(`${this.baseUrl}/${id}`, customer);
  }

  /**
   * Delete a customer (soft delete if has sales orders, hard delete otherwise)
   */
  deleteCustomer(id: string): Observable<Result<boolean>> {
    return this.http.delete<Result<boolean>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Restore a soft-deleted customer
   */
  restoreCustomer(id: string): Observable<Result<boolean>> {
    return this.http.post<Result<boolean>>(`${this.baseUrl}/${id}/restore`, {});
  }

  /**
   * Check if email is unique
   */
  checkEmailUnique(email: string, excludeCustomerId?: string): Observable<Result<boolean>> {
    let httpParams = new HttpParams().set('email', email);
    if (excludeCustomerId) {
      httpParams = httpParams.set('excludeCustomerId', excludeCustomerId);
    }
    
    return this.http.get<Result<boolean>>(`${this.baseUrl}/check-email-unique`, { params: httpParams });
  }
}

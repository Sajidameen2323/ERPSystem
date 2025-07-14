import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Result } from '../../core/models/shared.interface';
import { 
  Supplier, 
  SupplierCreate, 
  SupplierUpdate, 
  SupplierQueryParameters, 
  SupplierPagedResult,
  ProductSupplier,
  ProductSupplierCreate,
  ProductSupplierUpdate,
  ProductSupplierQueryParameters,
  ProductSupplierPagedResult
} from '../models/supplier.interface';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private readonly apiUrl = `/api/suppliers`;

  constructor(private http: HttpClient) {}

  /**
   * Get suppliers with filtering, sorting, and pagination
   */
  getSuppliers(params: SupplierQueryParameters): Observable<SupplierPagedResult> {
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
    if (params.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    if (params.country) {
      httpParams = httpParams.set('country', params.country);
    }

    return this.http.get<SupplierPagedResult>(this.apiUrl, { params: httpParams }).pipe(
        
        map(response => ({
        ...response,
        items: (response.items || []).map(item => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          lastPurchaseDate: item.lastPurchaseDate ? new Date(item.lastPurchaseDate) : undefined
        }))
      }))
    );
  }

  /**
   * Get supplier by ID
   */
  getSupplier(id: string): Observable<Supplier> {
    return this.http.get<Result<Supplier>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return {
            ...response.data,
            createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
            updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date(),
            lastPurchaseDate: response.data.lastPurchaseDate ? new Date(response.data.lastPurchaseDate) : undefined
          };
        }
        throw new Error(response.error || 'Failed to get supplier');
      })
    );
  }

  /**
   * Create a new supplier
   */
  createSupplier(supplier: SupplierCreate): Observable<Supplier> {
    return this.http.post<Result<Supplier>>(this.apiUrl, supplier).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return {
            ...response.data,
            createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
            updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date(),
            lastPurchaseDate: response.data.lastPurchaseDate ? new Date(response.data.lastPurchaseDate) : undefined
          };
        }
        throw new Error(response.error || 'Failed to create supplier');
      })
    );
  }

  /**
   * Update an existing supplier
   */
  updateSupplier(id: string, supplier: SupplierUpdate): Observable<Supplier> {
    return this.http.put<Result<Supplier>>(`${this.apiUrl}/${id}`, supplier).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return {
            ...response.data,
            createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
            updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date(),
            lastPurchaseDate: response.data.lastPurchaseDate ? new Date(response.data.lastPurchaseDate) : undefined
          };
        }
        throw new Error(response.error || 'Failed to update supplier');
      })
    );
  }

  /**
   * Delete a supplier (soft delete)
   */
  deleteSupplier(id: string): Observable<void> {
    return this.http.delete<Result<void>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response.isSuccess) {
          throw new Error(response.error || 'Failed to delete supplier');
        }
      })
    );
  }

  /**
   * Activate a supplier
   */
  activateSupplier(id: string): Observable<void> {
    return this.http.post<Result<void>>(`${this.apiUrl}/${id}/activate`, {}).pipe(
      map(response => {
        if (!response.isSuccess) {
          throw new Error(response.error || 'Failed to activate supplier');
        }
      })
    );
  }

  /**
   * Deactivate a supplier
   */
  deactivateSupplier(id: string): Observable<void> {
    return this.http.post<Result<void>>(`${this.apiUrl}/${id}/deactivate`, {}).pipe(
      map(response => {
        if (!response.isSuccess) {
          throw new Error(response.error || 'Failed to deactivate supplier');
        }
      })
    );
  }

  /**
   * Get product suppliers with filtering and pagination
   */
  getProductSuppliers(params: ProductSupplierQueryParameters): Observable<ProductSupplierPagedResult> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('pageSize', params.pageSize.toString());

    if (params.productId) {
      httpParams = httpParams.set('productId', params.productId);
    }
    if (params.supplierId) {
      httpParams = httpParams.set('supplierId', params.supplierId);
    }
    if (params.isPreferred !== undefined) {
      httpParams = httpParams.set('isPreferred', params.isPreferred.toString());
    }
    if (params.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.sortDirection) {
      httpParams = httpParams.set('sortDirection', params.sortDirection);
    }

    return this.http.get<ProductSupplierPagedResult>(`${this.apiUrl}/product-suppliers`, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        items: (response.items || []).map(item => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          lastPurchaseDate: item.lastPurchaseDate ? new Date(item.lastPurchaseDate) : undefined
        }))
      }))
    );
  }

  /**
   * Create a product-supplier relationship
   */
  createProductSupplier(productSupplier: ProductSupplierCreate): Observable<ProductSupplier> {
    return this.http.post<Result<ProductSupplier>>(`${this.apiUrl}/product-suppliers`, productSupplier).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return {
            ...response.data,
            createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
            updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date(),
            lastPurchaseDate: response.data.lastPurchaseDate ? new Date(response.data.lastPurchaseDate) : undefined
          };
        }
        throw new Error(response.error || 'Failed to create product supplier');
      })
    );
  }

  /**
   * Update a product-supplier relationship
   */
  updateProductSupplier(id: string, productSupplier: ProductSupplierUpdate): Observable<ProductSupplier> {
    return this.http.put<Result<ProductSupplier>>(`${this.apiUrl}/product-suppliers/${id}`, productSupplier).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return {
            ...response.data,
            createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
            updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date(),
            lastPurchaseDate: response.data.lastPurchaseDate ? new Date(response.data.lastPurchaseDate) : undefined
          };
        }
        throw new Error(response.error || 'Failed to update product supplier');
      })
    );
  }

  /**
   * Delete a product-supplier relationship
   */
  deleteProductSupplier(id: string): Observable<void> {
    return this.http.delete<Result<void>>(`${this.apiUrl}/product-suppliers/${id}`).pipe(
      map(response => {
        if (!response.isSuccess) {
          throw new Error(response.error || 'Failed to delete product supplier');
        }
      })
    );
  }

  /**
   * Get all active suppliers for dropdown/selection
   */
  getActiveSuppliersForSelection(): Observable<Supplier[]> {
    return this.getSuppliers({
      page: 1,
      pageSize: 1000,
      isActive: true,
      sortBy: 'name',
      sortDirection: 'asc'
    }).pipe(
      map(response => response.items)
    );
  }
}

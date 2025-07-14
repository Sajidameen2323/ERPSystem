import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Result } from '../../core/models/shared.interface';
import { 
  Product, 
  ProductCreate, 
  ProductUpdate, 
  ProductQueryParameters, 
  ProductPagedResult, 
  StockAdjustment, 
  StockAdjustmentPagedResult 
} from '../models/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `/api/products`;

  constructor(private http: HttpClient) {}

  /**
   * Get products with filtering, sorting, and pagination
   */
  getProducts(params: ProductQueryParameters): Observable<ProductPagedResult> {
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
    if (params.lowStockOnly !== undefined) {
      httpParams = httpParams.set('lowStockOnly', params.lowStockOnly.toString());
    }

    return this.http.get<ProductPagedResult>(this.apiUrl, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        items: (response.items || []).map(item => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date()
        }))
      }))
    );
  }

  /**
   * Get a single product by ID
   */
  getProduct(id: string): Observable<Product> {
    return this.http.get<Result<Product>>(`${this.apiUrl}/${id}`).pipe(
      map(result => {
        if (!result.isSuccess || !result.data) {
          throw new Error(result.error || result.message || 'Product not found');
        }
        return {
          ...result.data,
          createdAt: result.data.createdAt ? new Date(result.data.createdAt) : new Date(),
          updatedAt: result.data.updatedAt ? new Date(result.data.updatedAt) : new Date()
        };
      })
    );
  }

  /**
   * Create a new product
   */
  createProduct(product: ProductCreate): Observable<Product> {
    return this.http.post<Result<Product>>(this.apiUrl, product).pipe(
      map(result => {
        if (!result.isSuccess || !result.data) {
          throw new Error(result.error || result.message || 'Failed to create product');
        }
        return {
          ...result.data,
          createdAt: result.data.createdAt ? new Date(result.data.createdAt) : new Date(),
          updatedAt: result.data.updatedAt ? new Date(result.data.updatedAt) : new Date()
        };
      })
    );
  }

  /**
   * Update an existing product
   */
  updateProduct(id: string, product: ProductUpdate): Observable<Product> {
    return this.http.put<Result<Product>>(`${this.apiUrl}/${id}`, product).pipe(
      map(result => {
        if (!result.isSuccess || !result.data) {
          throw new Error(result.error || result.message || 'Failed to update product');
        }
        return {
          ...result.data,
          createdAt: result.data.createdAt ? new Date(result.data.createdAt) : new Date(),
          updatedAt: result.data.updatedAt ? new Date(result.data.updatedAt) : new Date()
        };
      })
    );
  }

  /**
   * Delete a product (soft delete)
   */
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<Result<void>>(`${this.apiUrl}/${id}`).pipe(
      map(result => {
        if (!result.isSuccess) {
          throw new Error(result.error || result.message || 'Failed to delete product');
        }
      })
    );
  }

  /**
   * Adjust stock for a product
   */
  adjustStock(productId: string, adjustment: StockAdjustment): Observable<void> {
    return this.http.post<Result<void>>(`${this.apiUrl}/${productId}/adjust-stock`, adjustment).pipe(
      map(result => {
        if (!result.isSuccess) {
          throw new Error(result.error || result.message || 'Failed to adjust stock');
        }
      })
    );
  }

  /**
   * Check if SKU is unique
   */
  checkSkuUniqueness(sku: string, excludeProductId?: string): Observable<boolean> {
    let httpParams = new HttpParams();
    if (excludeProductId) {
      httpParams = httpParams.set('excludeProductId', excludeProductId);
    }

    return this.http.get<Result<boolean>>(`${this.apiUrl}/check-sku/${encodeURIComponent(sku)}`, { params: httpParams }).pipe(
      map(result => {
        if (!result.isSuccess) {
          throw new Error(result.error || result.message || 'Failed to check SKU uniqueness');
        }
        return result.data !== undefined ? result.data : false;
      })
    );
  }

  /**
   * Get stock adjustment history
   */
  getStockAdjustments(productId?: string, page: number = 1, pageSize: number = 10): Observable<StockAdjustmentPagedResult> {
    let httpParams = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (productId) {
      httpParams = httpParams.set('productId', productId);
    }

    return this.http.get<StockAdjustmentPagedResult>(`${this.apiUrl}/stock-adjustments`, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        items: (response.items || []).map(item => ({
          ...item,
          adjustedAt: item.adjustedAt ? new Date(item.adjustedAt) : new Date()
        }))
      }))
    );
  }
}

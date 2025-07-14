import { PagedResult } from '../../core/models/shared.interface';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  currentStock: number;
  minimumStock?: number;
  isLowStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCreate {
  name: string;
  sku: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  currentStock: number;
  minimumStock?: number;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  unitPrice?: number;
  costPrice?: number;
  minimumStock?: number;
}

export interface ProductQueryParameters {
  page: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  lowStockOnly?: boolean;
}

export interface StockAdjustment {
  productId: string;
  adjustmentQuantity: number;
  reason: string;
}

export interface StockAdjustmentResponse {
  id: string;
  productId: string;
  productName: string;
  productSKU: string;
  adjustmentQuantity: number;
  reason: string;
  adjustedByUserId: string;
  adjustedAt: Date;
}

export type ProductPagedResult = PagedResult<Product>;
export type StockAdjustmentPagedResult = PagedResult<StockAdjustmentResponse>;

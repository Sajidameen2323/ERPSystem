import { PagedResult } from '../../core/models/shared.interface';

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  vatNumber?: string;
  isActive: boolean;
  supplierCode: string;
  paymentTerms?: string;
  creditLimit?: number;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  performanceRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierCreate {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  vatNumber?: string;
  paymentTerms?: string;
  creditLimit?: number;
}

export interface SupplierUpdate {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  vatNumber?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive?: boolean;
}

export interface SupplierQueryParameters {
  page: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  isActive?: boolean;
  country?: string;
}

export interface SupplierPagedResult extends PagedResult<Supplier> {}

export interface ProductSupplier {
  id: string;
  productId: string;
  supplierId: string;
  supplierProductCode?: string;
  costPrice: number;
  minimumOrderQuantity?: number;
  leadTimeDays?: number;
  isPreferred: boolean;
  isActive: boolean;
  lastPurchaseDate?: Date;
  totalPurchased: number;
  averageDeliveryTime?: number;
  qualityRating?: number;
  createdAt: Date;
  updatedAt: Date;
  // Navigation properties
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  supplier?: {
    id: string;
    name: string;
    supplierCode: string;
  };
}

export interface ProductSupplierCreate {
  productId: string;
  supplierId: string;
  supplierProductCode?: string;
  costPrice: number;
  minimumOrderQuantity?: number;
  leadTimeDays?: number;
  isPreferred?: boolean;
}

export interface ProductSupplierUpdate {
  supplierProductCode?: string;
  costPrice?: number;
  minimumOrderQuantity?: number;
  leadTimeDays?: number;
  isPreferred?: boolean;
  isActive?: boolean;
}

export interface ProductSupplierQueryParameters {
  page: number;
  pageSize: number;
  productId?: string;
  supplierId?: string;
  isPreferred?: boolean;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ProductSupplierPagedResult extends PagedResult<ProductSupplier> {}

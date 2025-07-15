import { PagedResult } from '../../core/models/shared.interface';

export enum PurchaseOrderStatus {
  Draft = 'Draft',
  Pending = 'Pending',
  Approved = 'Approved',
  PartiallyReceived = 'PartiallyReceived',
  Received = 'Received',
  Cancelled = 'Cancelled'
}

export enum StockMovementType {
  Purchase = 'Purchase',
  Sale = 'Sale',
  Adjustment = 'Adjustment',
  Transfer = 'Transfer',
  Return = 'Return',
  Damage = 'Damage'
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  totalAmount: number;
  notes?: string;
  createdByUserId: string;
  approvedByUserId?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Navigation properties
  supplierName?: string;
  supplier?: {
    id: string;
    name: string;
    supplierCode: string;
    contactPerson: string;
    email: string;
    phone: string;
  };
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedDate?: Date;
  notes?: string;
  // Navigation properties
  productName?: string;
  productSKU?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
  };
  purchaseOrder?: {
    id: string;
    poNumber: string;
    status: PurchaseOrderStatus;
  };
}

export interface PurchaseOrderCreate {
  supplierId: string;
  expectedDeliveryDate?: Date;
  notes?: string;
  items: PurchaseOrderItemCreate[];
}

export interface PurchaseOrderItemCreate {
  productId: string;
  orderedQuantity: number;
  unitPrice: number;
  notes?: string;
}

export interface PurchaseOrderUpdate {
  supplierId?: string;
  expectedDeliveryDate?: Date;
  notes?: string;
}

export interface PurchaseOrderItemUpdate {
  orderedQuantity?: number;
  unitPrice?: number;
  notes?: string;
}

export interface PurchaseOrderQueryParameters {
  page: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  status?: PurchaseOrderStatus;
  supplierId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PurchaseOrderPagedResult extends PagedResult<PurchaseOrder> {}

export interface ReceiveItemsRequest {
  items: ReceiveItemRequest[];
}

export interface ReceiveItemRequest {
  itemId: string;
  receivedQuantity: number;
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  movementType: StockMovementType;
  quantity: number;
  stockBeforeMovement: number;
  stockAfterMovement: number;
  reference?: string;
  reason: string;
  movedByUserId: string;
  movementDate: Date;
  notes?: string;
  // Navigation properties
  productName?: string;
  productSKU?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface StockMovementQueryParameters {
  page: number;
  pageSize: number;
  productId?: string;
  movementType?: StockMovementType;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface StockMovementPagedResult extends PagedResult<StockMovement> {}

// DTO interfaces for API communication
export interface ReceiveItemDto {
  receivedQuantity: number;
  notes?: string;
}

export interface StockMovementCreateDto {
  productId: string;
  movementType: StockMovementType;
  quantity: number;
  reference?: string;
  reason: string;
  notes?: string;
}

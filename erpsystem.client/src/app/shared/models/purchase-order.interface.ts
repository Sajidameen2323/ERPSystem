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
  orderNumber: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  totalAmount: number;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Navigation properties
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
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
  isReceived: boolean;
  notes?: string;
  // Navigation properties
  product?: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
  };
  purchaseOrder?: {
    id: string;
    orderNumber: string;
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
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface PurchaseOrderUpdate {
  supplierId?: string;
  expectedDeliveryDate?: Date;
  notes?: string;
}

export interface PurchaseOrderItemUpdate {
  quantity?: number;
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
  unitPrice?: number;
  totalValue?: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  // Navigation properties
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

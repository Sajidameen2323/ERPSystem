import { PagedResult } from '../../core/models/shared.interface';

export enum PurchaseOrderStatus {
  Draft = 'Draft',
  Pending = 'Pending',
  Approved = 'Approved',
  Sent = 'Sent',
  PartiallyReceived = 'PartiallyReceived',
  Received = 'Received',
  Cancelled = 'Cancelled'
}

export enum StockMovementType {
  StockIn = 'StockIn',
  StockOut = 'StockOut',
  Adjustment = 'Adjustment',
  Transfer = 'Transfer',
  Damaged = 'Damaged',
  Expired = 'Expired',
  Return = 'Return',
  ReturnToSupplier = 'ReturnToSupplier'
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
  expectedDeliveryDate?: Date;
  notes?: string;
  items?: PurchaseOrderItemUpdate[];
}

export interface PurchaseOrderItemUpdate {
  productId: string;
  orderedQuantity: number;
  unitPrice: number;
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
  // UI Helper properties
  isIncrease: boolean;
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

// Purchase Order Returns
export enum ReturnStatus {
  Pending = 0,
  Approved = 1, 
  Processed = 2,
  Cancelled = 3
}

export enum ReturnReason {
  Damaged = 0,
  DefectiveQuality = 1,
  WrongItem = 2,
  Excess = 3,
  NotAsOrdered = 4,
  Expired = 5,
  Other = 6
}

export interface PurchaseOrderReturn {
  id: string;
  returnNumber: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  status: ReturnStatus;
  returnDate: Date;
  processedDate?: Date;
  totalReturnAmount: number;
  notes?: string;
  createdByUserId: string;
  approvedByUserId?: string;
  approvedAt?: Date;
  processedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  items: PurchaseOrderReturnItem[];
}

export interface PurchaseOrderReturnItem {
  id: string;
  productId: string;
  productName: string;
  productSKU: string;
  purchaseOrderItemId: string;
  returnQuantity: number;
  unitPrice: number;
  totalReturnAmount: number;
  reason: ReturnReason;
  reasonDescription?: string;
  refundRequested: boolean;
  refundProcessed: boolean;
  refundProcessedDate?: Date;
  notes?: string;
  createdAt: Date;
}

export interface CreatePurchaseOrderReturnRequest {
  purchaseOrderId: string;
  supplierId: string;
  notes?: string;
  items: CreatePurchaseOrderReturnItem[];
}

export interface CreatePurchaseOrderReturnItem {
  productId: string;
  purchaseOrderItemId: string;
  returnQuantity: number;
  unitPrice: number;
  reason: ReturnReason;
  reasonDescription?: string;
  refundRequested: boolean;
  notes?: string;
}

export interface AvailableReturnItem {
  purchaseOrderItemId: string;
  productId: string;
  productName: string;
  productSKU: string;
  orderedQuantity: number;
  receivedQuantity: number;
  returnedQuantity: number;
  availableForReturn: number;
  currentStock: number;
  unitPrice: number;
}

export interface ApproveReturnRequest {
  notes?: string;
}

export interface CancelReturnRequest {
  notes?: string;
}

export interface ProcessReturnRequest {
  items: ProcessReturnItem[];
  notes?: string;
}

export interface ProcessReturnItem {
  returnItemId: string;
  refundProcessed: boolean;
  notes?: string;
}

export interface PurchaseOrderReturnFilters {
  page: number;
  pageSize: number;
  search?: string;
  status?: ReturnStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PurchaseOrderReturnPagedResult extends PagedResult<PurchaseOrderReturn> {}

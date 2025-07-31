import { Result, PagedResult } from '../../shared/models/common.model';

// Main Invoice interface matching backend InvoiceDto
export interface Invoice {
  id: string; // Guid from backend
  invoiceNumber: string;
  salesOrderId: string; // Guid from backend
  salesOrderReferenceNumber: string;
  customerId: string; // Guid from backend
  customerName: string;
  customerEmail: string;
  status: InvoiceStatus;
  invoiceDate: string; // ISO date string from backend
  dueDate: string; // ISO date string from backend
  subTotal: number; // Note: backend uses "SubTotal"
  taxAmount: number;
  discountAmount: number; // Missing in original model
  totalAmount: number;
  paidAmount: number; // backend uses "PaidAmount"
  balanceAmount: number;
  notes?: string;
  terms?: string; // Missing in original model
  paidDate?: string; // ISO date string, nullable
  refundRequestedAmount: number; // New refund tracking fields
  refundedAmount: number;
  refundRequestedDate?: string; // ISO date string, nullable
  refundedDate?: string; // ISO date string, nullable
  refundReason?: string;
  generatedByUserId: string;
  createdAt: string; // ISO date string from backend
  updatedAt: string; // ISO date string from backend
  isDeleted: boolean;
  invoiceItems: InvoiceItem[]; // backend uses "InvoiceItems"
}

export interface InvoiceItem {
  id: string; // Guid from backend
  invoiceId: string; // Guid from backend
  productId: string; // Guid from backend
  productName: string;
  productSKU: string; // Missing in original model
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  description?: string;
  createdAt: string; // ISO date string from backend
  updatedAt: string; // ISO date string from backend
  isDeleted: boolean;
}

// Payment related interfaces (if needed for future payment tracking)
export interface InvoicePayment {
  id: string;
  invoiceId: string;
  paymentDate: string; // ISO date string
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

// Enums matching backend exactly
export enum InvoiceStatus {
  Draft = 1,
  Sent = 2,
  Paid = 3,
  PartiallyPaid = 4,
  Overdue = 5,
  Cancelled = 6,
  RefundRequested = 7,
  Refunded = 8
}

export enum PaymentMethod {
  Cash = 'Cash',
  Check = 'Check',
  CreditCard = 'CreditCard',
  BankTransfer = 'BankTransfer',
  PayPal = 'PayPal',
  Other = 'Other'
}

// DTOs for API operations matching backend exactly
export interface CreateInvoiceRequest {
  salesOrderId: string; // Guid
  dueDate: string; // ISO date string
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
  terms?: string;
  invoiceItems: CreateInvoiceItemRequest[];
}

export interface CreateInvoiceItemRequest {
  productId: string; // Guid
  quantity: number;
  unitPrice: number;
  description?: string;
}

export interface UpdateInvoiceRequest {
  dueDate: string; // ISO date string
  taxAmount: number;
  discountAmount: number;
  notes?: string;
  terms?: string;
  invoiceItems: UpdateInvoiceItemRequest[];
}

export interface UpdateInvoiceItemRequest {
  id?: string; // Guid, null for new items
  productId: string; // Guid
  quantity: number;
  unitPrice: number;
  description?: string;
}

export interface InvoiceStatusUpdateRequest {
  status: InvoiceStatus;
  paidDate?: string; // ISO date string
  paidAmount?: number;
}

export interface InvoicePaymentRequest {
  paymentAmount: number;
  paymentDate: string; // ISO date string
  paymentNotes?: string;
}

export interface InvoiceRefundRequest {
  refundAmount?: number;
  reason?: string;
}

export interface InvoiceRefundProcessRequest {
  actualRefundAmount?: number;
  processingNotes?: string;
}

export interface InvoiceQueryParameters {
  customerId?: string; // Guid
  salesOrderId?: string; // Guid
  status?: InvoiceStatus;
  invoiceDateFrom?: string; // ISO date string
  invoiceDateTo?: string; // ISO date string
  dueDateFrom?: string; // ISO date string
  dueDateTo?: string; // ISO date string
  invoiceNumber?: string;
  customerName?: string;
  isOverdue?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

// List and summary interfaces for display
export interface InvoiceListItem {
  id: string; // Guid
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  invoiceDate: string; // ISO date string
  dueDate: string; // ISO date string
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  refundRequestedAmount?: number; // Amount requested for refund
  status: InvoiceStatus;
  daysPastDue?: number;
}

export interface InvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalOverdue: number;
  averagePaymentTime: number;
  invoicesByStatus: { [key in InvoiceStatus]: number };
}

// Calculation DTOs
export interface CalculateInvoiceTotalsRequest {
  invoiceItems: CreateInvoiceItemRequest[];
  taxAmount: number;
  discountAmount: number;
}

export interface InvoiceTotalsDto {
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

// Response types
export type GetInvoicesResponse = Result<PagedResult<InvoiceListItem>>;
export type GetInvoiceResponse = Result<Invoice>;
export type CreateInvoiceResponse = Result<Invoice>;
export type UpdateInvoiceResponse = Result<Invoice>;
export type DeleteInvoiceResponse = Result<void>;
export type InvoiceStatsResponse = Result<InvoiceStatistics>;
export type CalculateTotalsResponse = Result<InvoiceTotalsDto>;
export type GenerateNumberResponse = Result<string>;
export type CanEditResponse = Result<boolean>;
export type CanCancelResponse = Result<boolean>;

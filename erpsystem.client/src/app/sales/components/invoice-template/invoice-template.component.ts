import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice, InvoiceStatus } from '../../models/invoice.model';

@Component({
  selector: 'app-invoice-template',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div id="invoice-print-area" class="invoice-template">
      <!-- Company Header -->
      <div class="invoice-header">
        <div class="company-info">
          <h1>ERP System Company</h1>
          <div class="company-details">
            <p>123 Business Street</p>
            <p>Business City, BC 12345</p>
            <p>Phone: (555) 123-4567</p>
            <p>Email: info&#64;erpsystem.com</p>
            <p>Website: www.erpsystem.com</p>
          </div>
        </div>
        <div class="invoice-info">
          <h2>INVOICE</h2>
          <div class="invoice-details">
            <div class="detail-row">
              <span class="label">Invoice #:</span>
              <span class="value">{{ invoice().invoiceNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date:</span>
              <span class="value">{{ formatDate(invoice().invoiceDate) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Due Date:</span>
              <span class="value">{{ formatDate(invoice().dueDate) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value status" [class]="getStatusClass()">{{ getStatusText() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer and Sales Order Information -->
      <div class="customer-section">
        <div class="bill-to">
          <h3>Bill To:</h3>
          <div class="customer-details">
            <p class="customer-name">{{ invoice().customerName }}</p>
            <p class="customer-email">{{ invoice().customerEmail }}</p>
          </div>
        </div>
        <div class="sales-order">
          <h3>Sales Order:</h3>
          <p class="order-ref">{{ invoice().salesOrderReferenceNumber }}</p>
        </div>
      </div>

      <!-- Invoice Items Table -->
      <div class="items-section">
        <table class="items-table">
          <thead>
            <tr>
              <th class="description-col">Description</th>
              <th class="qty-col">Qty</th>
              <th class="price-col">Unit Price</th>
              <th class="total-col">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of invoice().invoiceItems; trackBy: trackByItemId" class="item-row">
              <td class="description">
                <div class="product-name">{{ item.productName }}</div>
                <div class="product-description" *ngIf="item.description">{{ item.description }}</div>
                <div class="product-sku" *ngIf="item.productSKU">SKU: {{ item.productSKU }}</div>
              </td>
              <td class="quantity">{{ item.quantity }}</td>
              <td class="unit-price">{{ formatCurrency(item.unitPrice) }}</td>
              <td class="line-total">{{ formatCurrency(item.lineTotal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals Section -->
      <div class="totals-section">
        <table class="totals-table">
          <tr class="subtotal-row">
            <td class="label">Subtotal:</td>
            <td class="amount">{{ formatCurrency(invoice().subTotal) }}</td>
          </tr>
          <tr *ngIf="invoice().discountAmount > 0" class="discount-row">
            <td class="label">Discount:</td>
            <td class="amount discount">-{{ formatCurrency(invoice().discountAmount) }}</td>
          </tr>
          <tr class="tax-row">
            <td class="label">Tax:</td>
            <td class="amount">{{ formatCurrency(invoice().taxAmount) }}</td>
          </tr>
          <tr class="total-row">
            <td class="label"><strong>Total:</strong></td>
            <td class="amount"><strong>{{ formatCurrency(invoice().totalAmount) }}</strong></td>
          </tr>
          <tr *ngIf="invoice().paidAmount > 0" class="paid-row">
            <td class="label">Paid:</td>
            <td class="amount">{{ formatCurrency(invoice().paidAmount) }}</td>
          </tr>
          <tr *ngIf="invoice().balanceAmount > 0" class="balance-row">
            <td class="label"><strong>Balance Due:</strong></td>
            <td class="amount balance"><strong>{{ formatCurrency(invoice().balanceAmount) }}</strong></td>
          </tr>
        </table>
      </div>

      <!-- Terms and Notes -->
      <div *ngIf="invoice().terms || invoice().notes" class="terms-notes-section">
        <div *ngIf="invoice().terms" class="terms">
          <h4>Terms & Conditions:</h4>
          <p>{{ invoice().terms }}</p>
        </div>
        <div *ngIf="invoice().notes" class="notes">
          <h4>Notes:</h4>
          <p>{{ invoice().notes }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="invoice-footer">
        <div class="payment-info">
          <h4>Payment Information:</h4>
          <p>Please remit payment within {{ getDaysUntilDue() }} days of invoice date.</p>
          <p>Thank you for your business!</p>
        </div>
        <div class="contact-info">
          <p>Questions? Contact us at info&#64;erpsystem.com or (555) 123-4567</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .invoice-template {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      background: white;
      color: #333;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.4;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 1rem;
    }

    .company-info h1 {
      margin: 0 0 0.5rem 0;
      color: #2563eb;
      font-size: 28px;
      font-weight: bold;
    }

    .company-details p {
      margin: 0.1rem 0;
      color: #666;
      font-size: 11px;
    }

    .invoice-info {
      text-align: right;
    }

    .invoice-info h2 {
      margin: 0 0 1rem 0;
      font-size: 32px;
      color: #333;
      font-weight: bold;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.3rem;
      min-width: 200px;
    }

    .detail-row .label {
      font-weight: bold;
      color: #555;
    }

    .detail-row .value {
      color: #333;
    }

    .status {
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
    }

    .status.paid { background-color: #dcfce7; color: #166534; }
    .status.sent { background-color: #dbeafe; color: #1d4ed8; }
    .status.draft { background-color: #f3f4f6; color: #374151; }
    .status.overdue { background-color: #fef2f2; color: #dc2626; }

    .customer-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2rem;
    }

    .bill-to h3, .sales-order h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 14px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.25rem;
    }

    .customer-name {
      font-weight: bold;
      font-size: 14px;
      margin: 0.25rem 0;
    }

    .customer-email {
      color: #666;
      margin: 0.25rem 0;
    }

    .sales-order {
      text-align: right;
    }

    .order-ref {
      font-weight: bold;
      margin: 0.25rem 0;
    }

    .items-section {
      margin-bottom: 1.5rem;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #ddd;
    }

    .items-table th {
      background-color: #f8f9fa;
      padding: 0.75rem 0.5rem;
      text-align: left;
      font-weight: bold;
      color: #333;
      border: 1px solid #ddd;
      font-size: 11px;
    }

    .items-table td {
      padding: 0.75rem 0.5rem;
      border: 1px solid #ddd;
      vertical-align: top;
    }

    .description-col { width: 50%; }
    .qty-col { width: 10%; text-align: center; }
    .price-col { width: 20%; text-align: right; }
    .total-col { width: 20%; text-align: right; }

    .product-name {
      font-weight: bold;
      margin-bottom: 0.25rem;
    }

    .product-description {
      color: #666;
      font-size: 10px;
      margin-bottom: 0.25rem;
    }

    .product-sku {
      color: #888;
      font-size: 9px;
    }

    .quantity, .unit-price, .line-total {
      text-align: right;
      font-family: 'Courier New', monospace;
    }

    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 2rem;
    }

    .totals-table {
      width: 300px;
      border-collapse: collapse;
    }

    .totals-table td {
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
    }

    .totals-table .label {
      text-align: right;
      padding-right: 1rem;
    }

    .totals-table .amount {
      text-align: right;
      font-family: 'Courier New', monospace;
      min-width: 100px;
    }

    .total-row td, .balance-row td {
      border-top: 2px solid #333;
      background-color: #f8f9fa;
      font-size: 14px;
    }

    .discount {
      color: #dc2626;
    }

    .balance {
      color: #dc2626;
      font-weight: bold;
    }

    .terms-notes-section {
      margin-bottom: 2rem;
      border-top: 1px solid #ddd;
      padding-top: 1rem;
    }

    .terms-notes-section h4 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 12px;
    }

    .terms-notes-section p {
      margin: 0.5rem 0;
      color: #555;
      font-size: 11px;
      line-height: 1.5;
    }

    .invoice-footer {
      border-top: 1px solid #ddd;
      padding-top: 1rem;
      margin-top: 2rem;
    }

    .payment-info h4 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 12px;
    }

    .payment-info p, .contact-info p {
      margin: 0.25rem 0;
      color: #666;
      font-size: 10px;
    }

    .contact-info {
      margin-top: 1rem;
      text-align: center;
    }

    /* Print-specific styles */
    @media print {
      .invoice-template {
        margin: 0;
        padding: 0.25in;
        box-shadow: none;
      }
      
      .invoice-header, .customer-section, .totals-section, .terms-notes-section {
        page-break-inside: avoid;
      }
      
      .items-table {
        page-break-inside: auto;
      }
      
      .item-row {
        page-break-inside: avoid;
      }
    }
  `]
})
export class InvoiceTemplateComponent {
  @Input() invoiceData: Invoice | null = null;

  invoice = signal<Invoice>({} as Invoice);

  ngOnChanges() {
    if (this.invoiceData) {
      this.invoice.set(this.invoiceData);
    }
  }

  trackByItemId(index: number, item: any): string {
    return item.id;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStatusText(): string {
    const status = this.invoice().status;
    switch (status) {
      case InvoiceStatus.Draft: return 'Draft';
      case InvoiceStatus.Sent: return 'Sent';
      case InvoiceStatus.Paid: return 'Paid';
      case InvoiceStatus.PartiallyPaid: return 'Partially Paid';
      case InvoiceStatus.Overdue: return 'Overdue';
      case InvoiceStatus.Cancelled: return 'Cancelled';
      case InvoiceStatus.RefundRequested: return 'Refund Requested';
      case InvoiceStatus.Refunded: return 'Refunded';
      default: return 'Unknown';
    }
  }

  getStatusClass(): string {
    const status = this.invoice().status;
    switch (status) {
      case InvoiceStatus.Paid: return 'paid';
      case InvoiceStatus.Sent: return 'sent';
      case InvoiceStatus.Draft: return 'draft';
      case InvoiceStatus.Overdue: return 'overdue';
      default: return 'draft';
    }
  }

  getDaysUntilDue(): number {
    const dueDate = new Date(this.invoice().dueDate);
    const invoiceDate = new Date(this.invoice().invoiceDate);
    const diffTime = dueDate.getTime() - invoiceDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

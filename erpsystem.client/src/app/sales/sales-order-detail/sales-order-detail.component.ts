import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

// Lucide Icons
import { LucideAngularModule, ArrowLeft, Edit, Trash2, Package, Calendar, DollarSign, User, FileText, Truck, RefreshCw, Receipt } from 'lucide-angular';

// Services and Models
import { SalesOrderService } from '../services/sales-order.service';
import { SalesOrder, getStatusLabel, getStatusColor, SalesOrderStatus } from '../models/sales-order.model';

// Components
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { SalesOrderStatusUpdateComponent } from '../sales-order-status-update/sales-order-status-update.component';

@Component({
  selector: 'app-sales-order-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    LucideAngularModule,
    LoadingSpinnerComponent,
    SalesOrderStatusUpdateComponent
  ],
  templateUrl: './sales-order-detail.component.html',
  styleUrls: ['./sales-order-detail.component.css']
})
export class SalesOrderDetailComponent implements OnInit {
  private readonly salesOrderService = inject(SalesOrderService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Expose utilities for template
  readonly getStatusLabel = getStatusLabel;
  readonly getStatusColor = getStatusColor;
  readonly SalesOrderStatus = SalesOrderStatus;

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly EditIcon = Edit;
  readonly Trash2Icon = Trash2;
  readonly PackageIcon = Package;
  readonly CalendarIcon = Calendar;
  readonly DollarSignIcon = DollarSign;
  readonly UserIcon = User;
  readonly FileTextIcon = FileText;
  readonly TruckIcon = Truck;
  readonly RefreshCwIcon = RefreshCw;
  readonly ReceiptIcon = Receipt;

  // Signals
  salesOrder = signal<SalesOrder | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  orderId = signal<string>('');
  showStatusUpdate = signal(false);

  // Business Rules
  /**
   * Check if a sales order can be updated (form editing)
   * Orders can only be edited when status is New, Processing, or On Hold
   */
  canUpdateOrder(order: SalesOrder): boolean {
    if (order.isDeleted) return false;
    return order.status === SalesOrderStatus.New || 
           order.status === SalesOrderStatus.Processing || 
           order.status === SalesOrderStatus.OnHold;
  }

  /**
   * Check if a sales order status can be updated
   * Status updates are available for all non-deleted orders to allow proper workflow transitions
   */
  canUpdateStatus(order: SalesOrder): boolean {
    return !order.isDeleted && order.status !== SalesOrderStatus.Returned;
  }

  /**
   * Get tooltip text explaining why an action is disabled
   */
  getDisabledTooltip(order: SalesOrder, action: 'update' | 'edit' | 'status'): string {
    if (order.isDeleted) {
      return 'Cannot perform this action on deleted orders';
    }
    
    const statusLabel = getStatusLabel(order.status);
    if (action === 'update' || action === 'edit') {
      return `Cannot edit orders with status "${statusLabel}". Only "New", "Processing", and "On Hold" orders can be edited.`;
    } else if (action === 'status') {
      return `Status updates are available for all active orders to ensure proper workflow transitions.`;
    }
    return '';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId.set(id);
      this.loadSalesOrder(id);
    } else {
      this.router.navigate(['/dashboard/sales/orders']);
    }
  }

  /**
   * Load sales order details
   */
  loadSalesOrder(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.salesOrderService.getSalesOrderById(id)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (order) => {
          this.salesOrder.set(order);
        },
        error: (error) => {
          console.error('Error loading sales order:', error);
          this.error.set('Failed to load sales order. Please try again.');
        }
      });
  }

  /**
   * Navigate back to sales order list
   */
  goBack(): void {
    this.router.navigate(['/dashboard/sales/orders']);
  }

  /**
   * Navigate to edit page
   */
  editOrder(): void {
    const order = this.salesOrder();
    if (!order) return;
    
    // Check if order can be updated
    if (!this.canUpdateOrder(order)) {
      this.error.set(this.getDisabledTooltip(order, 'edit'));
      return;
    }
    
    this.router.navigate(['/dashboard/sales/orders', this.orderId(), 'edit']);
  }

  /**
   * Show status update component
   */
  updateStatus(): void {
    const order = this.salesOrder();
    if (!order) return;
    
    // Check if order status can be updated
    if (!this.canUpdateStatus(order)) {
      this.error.set(this.getDisabledTooltip(order, 'status'));
      return;
    }
    
    this.showStatusUpdate.set(true);
  }

  /**
   * Handle status update completion
   */
  onStatusUpdated(updatedOrder: SalesOrder): void {
    this.salesOrder.set(updatedOrder);
    this.showStatusUpdate.set(false);
  }

  /**
   * Handle status update cancellation
   */
  onStatusUpdateCancelled(): void {
    this.showStatusUpdate.set(false);
  }

  /**
   * Calculate order total
   */
  calculateTotal(): number {
    const order = this.salesOrder();
    return order?.orderItems?.reduce((total, item) => total + item.lineTotal, 0) || 0;
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  /**
   * Format datetime
   */
  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString();
  }

  /**
   * Get invoice status color class
   */
  getInvoiceStatusColor(status: number): string {
    switch (status) {
      case 1: // Draft
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 2: // Sent
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 3: // Paid
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 4: // PartiallyPaid
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 5: // Overdue
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 6: // Cancelled
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 7: // Refunded
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  /**
   * Check if invoice has overdue payment
   */
  isInvoiceOverdue(invoice: any): boolean {
    return invoice.isOverdue || invoice.status === 5; // Overdue status
  }
}

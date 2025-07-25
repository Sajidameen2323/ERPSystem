import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

// Lucide Icons
import { LucideAngularModule, Package, Truck, CheckCircle, XCircle, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-angular';

// Services and Models
import { SalesOrderService } from '../services/sales-order.service';
import { SalesOrder, SalesOrderStatus, SalesOrderStatusUpdateRequest, getStatusLabel, getStatusColor, canTransitionTo, getValidTransitions } from '../models/sales-order.model';

// Shared Components
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-sales-order-status-update',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './sales-order-status-update.component.html',
  styleUrls: ['./sales-order-status-update.component.css']
})
export class SalesOrderStatusUpdateComponent {
  @Input({ required: true }) salesOrder!: SalesOrder;
  @Output() statusUpdated = new EventEmitter<SalesOrder>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly salesOrderService = inject(SalesOrderService);
  private readonly fb = inject(FormBuilder);

  // Expose utilities for template
  readonly getStatusLabel = getStatusLabel;
  readonly getStatusColor = getStatusColor;
  readonly SalesOrderStatus = SalesOrderStatus;

  // Icons
  readonly PackageIcon = Package;
  readonly TruckIcon = Truck;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly AlertCircleIcon = AlertCircle;
  readonly RefreshCwIcon = RefreshCw;
  readonly AlertTriangleIcon = AlertTriangle;

  // Signals
  loading = signal(false);
  error = signal<string | null>(null);
  statusForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize the status update form
   */
  initializeForm(): void {
    this.statusForm = this.fb.group({
      status: ['', [Validators.required]], // Start with empty to force user selection
      shippedDate: [this.salesOrder.shippedDate],
      deliveredDate: [this.salesOrder.deliveredDate]
    });

    // Watch for status changes to show/hide date fields
    this.statusForm.get('status')?.valueChanges.subscribe(status => {
      this.updateDateFieldsVisibility(status);
    });
  }

  /**
   * Update visibility of date fields based on selected status
   */
  updateDateFieldsVisibility(status: SalesOrderStatus): void {
    const shippedDateControl = this.statusForm.get('shippedDate');
    const deliveredDateControl = this.statusForm.get('deliveredDate');

    // Clear validators first
    shippedDateControl?.clearValidators();
    deliveredDateControl?.clearValidators();

    // Add validators based on status
    if (status === SalesOrderStatus.Shipped) {
      shippedDateControl?.setValidators([Validators.required]);
    }
    if (status === SalesOrderStatus.Completed) {
      deliveredDateControl?.setValidators([Validators.required]);
    }

    shippedDateControl?.updateValueAndValidity();
    deliveredDateControl?.updateValueAndValidity();
  }

  /**
   * Get valid status transitions for current order
   */
  getValidStatusTransitions(): { value: SalesOrderStatus; label: string; description: string }[] {
    const validStatuses = getValidTransitions(this.salesOrder.status);
    
    return validStatuses.map(status => ({
      value: status,
      label: getStatusLabel(status),
      description: this.getStatusDescription(status)
    }));
  }

  /**
   * Get description for status transitions
   */
  getStatusDescription(status: SalesOrderStatus | string | null): string {
    // Convert string to number if needed
    const statusValue = typeof status === 'string' ? parseInt(status, 10) : status;
    
    if (statusValue === null || statusValue === undefined || isNaN(statusValue as number)) {
      return 'Select a status to see what ERP actions will be performed.';
    }

    switch (statusValue) {
      case SalesOrderStatus.Processing:
        return '📋 ERP Actions: Stock will be reserved for this order, an invoice will be automatically generated, and the order moves into the fulfillment queue. Inventory levels will be updated to reflect reserved quantities.';
      case SalesOrderStatus.Shipped:
        return '🚛 ERP Actions: Stock quantities will be permanently deducted from inventory, shipping documentation will be created, tracking information will be recorded, and customer will be notified automatically.';
      case SalesOrderStatus.Completed:
        return '✅ ERP Actions: Order closes successfully, final invoice is marked as paid, delivery confirmation is recorded, customer satisfaction tracking begins, and sales analytics are updated.';
      case SalesOrderStatus.Cancelled:
        return '❌ ERP Actions: All reserved stock will be immediately released back to available inventory, any generated invoices will be voided, and cancellation reason will be logged for analytics.';
      case SalesOrderStatus.Returned:
        return '↩️ ERP Actions: Stock quantities will be restored to inventory (pending quality check), return documentation will be created, refund process will be initiated, and return analytics will be updated.';
      case SalesOrderStatus.OnHold:
        return '⏸️ ERP Actions: Order processing is temporarily suspended, stock reservations are maintained, automated workflows are paused, and hold reason will be tracked for resolution.';
      default:
        return 'Select a status to see what ERP actions will be performed.';
    }
  }

  /**
   * Get business warning for critical status changes
   */
  getBusinessWarning(status: SalesOrderStatus | string | null): string {
    // Convert string to number if needed
    const statusValue = typeof status === 'string' ? parseInt(status, 10) : status;
    
    if (statusValue === null || statusValue === undefined || isNaN(statusValue as number)) {
      return '';
    }

    switch (statusValue) {
      case SalesOrderStatus.Processing:
        return 'This action will reserve inventory and generate invoices. Ensure all order details are correct before proceeding.';
      case SalesOrderStatus.Shipped:
        return 'This action will permanently deduct stock from inventory. This cannot be easily reversed.';
      case SalesOrderStatus.Completed:
        return 'This action finalizes the order and triggers payment collection. Ensure delivery has been confirmed.';
      case SalesOrderStatus.Cancelled:
        return 'This action will void invoices and release all reserved stock. Consider putting on hold first if issues might be resolved.';
      case SalesOrderStatus.Returned:
        return 'This action initiates the return process and affects inventory levels. Ensure return authorization has been granted.';
      case SalesOrderStatus.OnHold:
        return 'This action pauses all automated processing. Remember to resolve the hold reason and update status accordingly.';
      default:
        return '';
    }
  }

  /**
   * Get detailed impact points for a status change
   */
  getDetailedImpacts(status: SalesOrderStatus | string | null): string[] {
    // Convert string to number if needed
    const statusValue = typeof status === 'string' ? parseInt(status, 10) : status;
    
    if (statusValue === null || statusValue === undefined || isNaN(statusValue as number)) {
      return [];
    }

    switch (statusValue) {
      case SalesOrderStatus.Processing:
        return [
          'Reserve inventory quantities for all order items',
          'Generate and send invoice to customer accounting system',
          'Update order queue for fulfillment team',
          'Set expected ship date based on inventory availability',
          'Send order confirmation email to customer'
        ];
      case SalesOrderStatus.Shipped:
        return [
          'Deduct stock quantities from available inventory',
          'Create shipping manifest and tracking documents',
          'Update inventory valuation and COGS calculations',
          'Generate shipping notification for customer',
          'Update order expected delivery date'
        ];
      case SalesOrderStatus.Completed:
        return [
          'Finalize invoice and mark as payable',
          'Record delivery confirmation and proof of delivery',
          'Release any remaining inventory reservations',
          'Trigger customer satisfaction survey',
          'Update sales analytics and commission calculations'
        ];
      case SalesOrderStatus.Cancelled:
        return [
          'Release all reserved inventory back to available stock',
          'Void any generated invoices and credit notes',
          'Update order analytics with cancellation reason',
          'Send cancellation notification to customer',
          'Clear order from fulfillment and shipping queues'
        ];
      case SalesOrderStatus.Returned:
        return [
          'Create return merchandise authorization (RMA)',
          'Schedule inventory inspection upon receipt',
          'Initialize refund processing workflow',
          'Update customer return history and analytics',
          'Generate return shipping label if applicable'
        ];
      case SalesOrderStatus.OnHold:
        return [
          'Pause all automated processing and workflows',
          'Maintain current inventory reservations',
          'Flag order for manual review and resolution',
          'Send hold notification to relevant departments',
          'Track hold duration for performance metrics'
        ];
      default:
        return [];
    }
  }

  /**
   * Get icon for status
   */
  getStatusIcon(status: SalesOrderStatus): any {
    switch (status) {
      case SalesOrderStatus.Processing:
        return this.RefreshCwIcon;
      case SalesOrderStatus.Shipped:
        return this.TruckIcon;
      case SalesOrderStatus.Completed:
        return this.CheckCircleIcon;
      case SalesOrderStatus.Cancelled:
        return this.XCircleIcon;
      case SalesOrderStatus.Returned:
        return this.AlertCircleIcon;
      case SalesOrderStatus.OnHold:
        return this.AlertCircleIcon;
      default:
        return this.PackageIcon;
    }
  }

  /**
   * Check if status field should be shown
   */
  shouldShowDateField(status: SalesOrderStatus): boolean {
    const currentStatus = this.statusForm.get('status')?.value;
    return currentStatus === status;
  }

  /**
   * Update sales order status
   */
  updateStatus(): void {
    if (!this.statusForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.statusForm.value;
    const updateRequest: SalesOrderStatusUpdateRequest = {
      status: formValue.status,
      shippedDate: formValue.shippedDate ? new Date(formValue.shippedDate) : undefined,
      deliveredDate: formValue.deliveredDate ? new Date(formValue.deliveredDate) : undefined,
      updatedByUserId: 'current-user-id' // TODO: Get from auth service
    };

    this.salesOrderService.updateSalesOrderStatus(this.salesOrder.id, updateRequest)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (updatedOrder) => {
          this.statusUpdated.emit(updatedOrder);
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.error.set(error.error?.message || 'Failed to update order status. Please try again.');
        }
      });
  }

  /**
   * Cancel status update
   */
  cancel(): void {
    this.cancelled.emit();
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.statusForm.controls).forEach(key => {
      const control = this.statusForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string | null {
    const field = this.statusForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return `${fieldName} is required`;
      }
    }
    return null;
  }
}

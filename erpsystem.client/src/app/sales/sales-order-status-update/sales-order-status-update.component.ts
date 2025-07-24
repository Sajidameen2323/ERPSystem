import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

// Lucide Icons
import { LucideAngularModule, Package, Truck, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-angular';

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
      status: [this.salesOrder.status, [Validators.required]],
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
  getStatusDescription(status: SalesOrderStatus): string {
    switch (status) {
      case SalesOrderStatus.Processing:
        return 'Order is being prepared and invoice will be created';
      case SalesOrderStatus.Shipped:
        return 'Order is shipped and stock will be deducted';
      case SalesOrderStatus.Completed:
        return 'Order is delivered and completed';
      case SalesOrderStatus.Cancelled:
        return 'Order is cancelled and stock reservations will be released';
      case SalesOrderStatus.Returned:
        return 'Order is returned and stock will be restored';
      case SalesOrderStatus.OnHold:
        return 'Order is temporarily on hold';
      default:
        return '';
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

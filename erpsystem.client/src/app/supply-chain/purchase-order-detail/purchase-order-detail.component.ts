

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule, ArrowLeft, Edit, FileText, Truck, CheckCircle, XCircle, Clock, Package, RotateCcw, AlertTriangle } from 'lucide-angular';

import { PurchaseOrderService } from '../../shared/services/purchase-order.service';
import { PurchaseOrderReturnService } from '../../shared/services/purchase-order-return.service';
import { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderReturn, ReturnStatus } from '../../shared/models/purchase-order.interface';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ConfirmationModalComponent
  ],
  templateUrl: './purchase-order-detail.component.html',
  styleUrl: './purchase-order-detail.component.css'
})
export class PurchaseOrderDetailComponent implements OnInit, OnDestroy {
  purchaseOrder: PurchaseOrder | null = null;
  purchaseOrderReturns: PurchaseOrderReturn[] = [];
  loading = false;
  loadingReturns = false;
  error: string | null = null;

  // Confirmation modal
  showConfirmationModal = false;
  confirmationConfig: ConfirmationConfig = {
    title: '',
    message: ''
  };
  pendingAction: (() => void) | null = null;
  currentCancellingPurchaseOrder: PurchaseOrder | null = null;

  // Receive item modal
  showReceiveItemModal = false;
  receiveItemForm: FormGroup;
  currentReceiveItem: any = null;

  // Expose enums for template
  readonly PurchaseOrderStatus = PurchaseOrderStatus;
  readonly ReturnStatus = ReturnStatus;

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly EditIcon = Edit;
  readonly FileTextIcon = FileText;
  readonly TruckIcon = Truck;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly ClockIcon = Clock;
  readonly PackageIcon = Package;
  readonly RotateCcwIcon = RotateCcw;
  readonly AlertTriangleIcon = AlertTriangle;
  canMarkPending(status: PurchaseOrderStatus): boolean {
    return status === PurchaseOrderStatus.Draft;
  }

  markAsPending(po: PurchaseOrder): void {
    if (!po || po.status !== PurchaseOrderStatus.Draft) return;
    
    this.confirmationConfig = {
      title: 'Mark as Pending',
      message: `Are you sure you want to mark purchase order ${po.poNumber} as pending?`,
      confirmText: 'Mark as Pending',
      cancelText: 'Cancel',
      type: 'warning'
    };
    
    this.pendingAction = () => this.executeMarkAsPending(po);
    this.showConfirmationModal = true;
  }

  private executeMarkAsPending(po: PurchaseOrder): void {
    this.loading = true;
    this.error = null;
    this.purchaseOrderService.markAsPending(po.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadPurchaseOrder(po.id);
      },
      error: (err) => {
        this.error = err?.message || 'Failed to mark as pending.';
        this.loading = false;
      }
    });
  }

  canSend(status: PurchaseOrderStatus): boolean {
    return this.purchaseOrderService.canSend(status);
  }

  sendPurchaseOrder(po: PurchaseOrder): void {
    if (!po || !this.canSend(po.status)) return;
    
    this.confirmationConfig = {
      title: 'Send to Supplier',
      message: `Are you sure you want to send purchase order ${po.poNumber} to the supplier?`,
      confirmText: 'Send Order',
      cancelText: 'Cancel',
      type: 'info',
      details: [
        'This will notify the supplier about the order',
        'The order status will be updated to "Sent"',
        'You can then receive items when they arrive'
      ]
    };
    
    this.pendingAction = () => this.executeSendPurchaseOrder(po);
    this.showConfirmationModal = true;
  }

  private executeSendPurchaseOrder(po: PurchaseOrder): void {
    this.loading = true;
    this.error = null;
    this.purchaseOrderService.sendPurchaseOrder(po.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadPurchaseOrder(po.id);
      },
      error: (err) => {
        this.error = err?.message || 'Failed to send purchase order.';
        this.loading = false;
      }
    });
  }

  canCancel(status: PurchaseOrderStatus): boolean {
    return this.purchaseOrderService.canCancel(status);
  }

  cancelPurchaseOrder(po: PurchaseOrder): void {
    if (!po || !this.canCancel(po.status)) return;
    
    this.confirmationConfig = {
      title: 'Cancel Purchase Order',
      message: `Are you sure you want to cancel purchase order ${po.poNumber}?`,
      confirmText: 'Cancel Order',
      cancelText: 'Keep Order',
      type: 'danger',
      details: [
        'This action cannot be undone',
        'The order will be marked as cancelled',
        'Please provide a reason for cancellation'
      ],
      inputFields: [
        {
          key: 'reason',
          label: 'Cancellation Reason',
          type: 'textarea',
          placeholder: 'Please provide a detailed reason for cancelling this purchase order...',
          required: true,
          minLength: 10,
          maxLength: 500,
          rows: 4
        }
      ]
    };
    
    this.pendingAction = () => {}; // Clear pending action since we handle it in the confirmation
    this.currentCancellingPurchaseOrder = po; // Store the purchase order for cancellation
    this.showConfirmationModal = true;
  }

  private executeCancelPurchaseOrder(po: PurchaseOrder, reason: string): void {
    this.loading = true;
    this.error = null;
    this.purchaseOrderService.cancelPurchaseOrder(po.id, reason).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadPurchaseOrder(po.id);
      },
      error: (err) => {
        this.error = err?.message || 'Failed to cancel purchase order.';
        this.loading = false;
      }
    });
  }

  receiveFullOrder(po: PurchaseOrder): void {
    if (!po || !this.canReceiveItems(po.status)) return;
    
    const pendingItems = po.items?.filter(item => item.receivedQuantity < item.orderedQuantity) || [];
    
    this.confirmationConfig = {
      title: 'Receive Full Order',
      message: `Mark all remaining items in purchase order ${po.poNumber} as received?`,
      confirmText: 'Receive All',
      cancelText: 'Cancel',
      type: 'success',
      details: [
        `${pendingItems.length} item(s) will be marked as received`,
        'Stock levels will be updated automatically',
        'This action cannot be undone'
      ]
    };
    
    this.pendingAction = () => this.executeReceiveFullOrder(po);
    this.showConfirmationModal = true;
  }

  private executeReceiveFullOrder(po: PurchaseOrder): void {
    this.loading = true;
    this.error = null;
    this.purchaseOrderService.receiveFullOrder(po.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadPurchaseOrder(po.id);
      },
      error: (err) => {
        this.error = err?.message || 'Failed to receive full order.';
        this.loading = false;
      }
    });
  }

  receiveItem(item: any): void {
    if (!item || !this.purchaseOrder) return;
    
    this.currentReceiveItem = item;
    const maxQty = item.orderedQuantity - item.receivedQuantity;
    
    // Reset and setup form
    this.receiveItemForm.patchValue({
      quantity: maxQty,
      notes: ''
    });
    
    // Update quantity validator to max allowable
    this.receiveItemForm.get('quantity')?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(maxQty)
    ]);
    this.receiveItemForm.get('quantity')?.updateValueAndValidity();
    
    this.showReceiveItemModal = true;
  }

  approvePurchaseOrder(po: PurchaseOrder): void {
    if (!po || !this.canApprove(po.status)) return;
    
    this.confirmationConfig = {
      title: 'Approve Purchase Order',
      message: `Are you sure you want to approve purchase order ${po.poNumber}?`,
      confirmText: 'Approve',
      cancelText: 'Cancel',
      type: 'success',
      details: [
        'This will approve the order for processing',
        'Once approved, the order can be sent to supplier',
        'Order amount: ' + this.formatCurrency(po.totalAmount)
      ]
    };
    
    this.pendingAction = () => this.executeApprovePurchaseOrder(po);
    this.showConfirmationModal = true;
  }

  private executeApprovePurchaseOrder(po: PurchaseOrder): void {
    this.loading = true;
    this.error = null;
    this.purchaseOrderService.approvePurchaseOrder(po.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadPurchaseOrder(po.id);
      },
      error: (err) => {
        this.error = err?.message || 'Failed to approve purchase order.';
        this.loading = false;
      }
    });
  }

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private purchaseOrderService: PurchaseOrderService,
    private returnService: PurchaseOrderReturnService,
    private fb: FormBuilder
  ) {
    this.receiveItemForm = this.fb.group({
      quantity: [0, [Validators.required, Validators.min(1)]],
      notes: ['']
    });
  }

  // Confirmation modal handlers
  onConfirmationConfirmed(data: {[key: string]: any}): void {
    // Handle cancellation with input data
    if (this.currentCancellingPurchaseOrder && data && data['reason']) {
      this.executeCancelPurchaseOrder(this.currentCancellingPurchaseOrder, data['reason']);
      this.currentCancellingPurchaseOrder = null;
      return;
    }
    
    // Handle other confirmations with pending actions
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
  }

  onConfirmationCancelled(): void {
    this.pendingAction = null;
    this.currentCancellingPurchaseOrder = null;
  }

  // Receive item modal handlers
  onReceiveItemConfirm(): void {
    if (!this.receiveItemForm.valid || !this.currentReceiveItem || !this.purchaseOrder) return;
    
    const formValue = this.receiveItemForm.value;
    this.loading = true;
    this.error = null;
    
    const dto = { 
      receivedQuantity: formValue.quantity,
      notes: formValue.notes || undefined
    };
    
    this.purchaseOrderService.receiveItem(this.currentReceiveItem.id, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadPurchaseOrder(this.purchaseOrder!.id);
          this.onReceiveItemCancel(); // Close modal
        },
        error: (err) => {
          this.error = err?.message || 'Failed to receive item.';
          this.loading = false;
        }
      });
  }

  onReceiveItemCancel(): void {
    this.showReceiveItemModal = false;
    this.currentReceiveItem = null;
    this.receiveItemForm.reset();
  }

  getRemainingQuantity(): number {
    if (!this.currentReceiveItem) return 0;
    return this.currentReceiveItem.orderedQuantity - this.currentReceiveItem.receivedQuantity;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPurchaseOrder(id);
      this.loadPurchaseOrderReturns(id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPurchaseOrder(id: string): void {
    this.loading = true;
    this.error = null;

    this.purchaseOrderService.getPurchaseOrder(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (purchaseOrder) => {
          this.purchaseOrder = purchaseOrder;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load purchase order details. Please try again.';
          this.loading = false;
          console.error('Error loading purchase order:', error);
        }
      });
  }

  getStatusBadgeClass(status: PurchaseOrderStatus): string {
    return this.purchaseOrderService.getStatusBadgeClass(status);
  }

  canEdit(status: PurchaseOrderStatus): boolean {
    return this.purchaseOrderService.canEdit(status);
  }

  canApprove(status: PurchaseOrderStatus): boolean {
    return this.purchaseOrderService.canApprove(status);
  }

  canReceiveItems(status: PurchaseOrderStatus): boolean {
    return this.purchaseOrderService.canReceiveItems(status);
  }

  canCreateReturn(status: PurchaseOrderStatus): boolean {
    return this.purchaseOrderService.canCreateReturn(status);
  }

  hasPurchaseOrderReturnStatus(status: PurchaseOrderStatus): boolean {
    return status === PurchaseOrderStatus.PartiallyReturned || status === PurchaseOrderStatus.Returned;
  }

  getPurchaseOrderReturnStatusText(status: PurchaseOrderStatus): string {
    switch (status) {
      case PurchaseOrderStatus.PartiallyReturned:
        return 'Partially Returned';
      case PurchaseOrderStatus.Returned:
        return 'Fully Returned';
      default:
        return '';
    }
  }

  getPurchaseOrderReturnStatusBadgeClass(status: PurchaseOrderStatus): string {
    switch (status) {
      case PurchaseOrderStatus.PartiallyReturned:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      case PurchaseOrderStatus.Returned:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return '';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  }

  formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }

  // Return-related methods
  loadPurchaseOrderReturns(purchaseOrderId: string): void {
    this.loadingReturns = true;
    
    this.returnService.getReturnsByPurchaseOrder(purchaseOrderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.isSuccess && result.data) {
            // Filter for processed returns only and sort by return date (latest first)
            this.purchaseOrderReturns = result.data
              .filter(returnOrder => returnOrder.status === ReturnStatus.Processed)
              .sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime());
          } else {
            this.purchaseOrderReturns = [];
          }
          this.loadingReturns = false;
        },
        error: (err) => {
          console.error('Error loading returns:', err);
          this.purchaseOrderReturns = [];
          this.loadingReturns = false;
        }
      });
  }

  getReturnStatusBadgeClass(status: ReturnStatus): string {
    switch (status) {
      case ReturnStatus.Pending:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case ReturnStatus.Approved:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case ReturnStatus.Processed:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case ReturnStatus.Cancelled:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getReturnStatusIcon(status: ReturnStatus) {
    switch (status) {
      case ReturnStatus.Pending:
        return this.ClockIcon;
      case ReturnStatus.Approved:
        return this.CheckCircleIcon;
      case ReturnStatus.Processed:
        return this.PackageIcon;
      case ReturnStatus.Cancelled:
        return this.XCircleIcon;
      default:
        return this.AlertTriangleIcon;
    }
  }

  getReturnStatusText(status: ReturnStatus | number): string {
    const statusValue = typeof status === 'number' ? status : status;
    switch (statusValue) {
      case ReturnStatus.Pending:
        return 'Pending';
      case ReturnStatus.Approved:
        return 'Approved';
      case ReturnStatus.Processed:
        return 'Processed';
      case ReturnStatus.Cancelled:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  getItemReturnStatus(item: any): { label: string; class: string; icon: any } {
    if (!this.purchaseOrderReturns.length) {
      return {
        label: 'No Returns',
        class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        icon: this.PackageIcon
      };
    }

    const returnedQuantity = this.getTotalReturnedQuantity(item.id);
    const receivedQuantity = item.receivedQuantity || 0;

    if (returnedQuantity === 0) {
      return {
        label: 'No Returns',
        class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        icon: this.PackageIcon
      };
    } else if (returnedQuantity >= receivedQuantity) {
      return {
        label: 'Fully Returned',
        class: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        icon: this.RotateCcwIcon
      };
    } else {
      return {
        label: 'Partially Returned',
        class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
        icon: this.AlertTriangleIcon
      };
    }
  }

  getTotalReturnedQuantity(itemId: string): number {
    return this.purchaseOrderReturns
      .filter(returnOrder => returnOrder.status === ReturnStatus.Processed)
      .reduce((total, returnOrder) => {
        const returnedItems = returnOrder.items?.filter(item => item.purchaseOrderItemId === itemId) || [];
        return total + returnedItems.reduce((itemTotal, item) => itemTotal + (item.returnQuantity || 0), 0);
      }, 0);
  }

  getReasonDisplayText(reason: number | string): string {
    return this.returnService.getReasonDisplayText(reason);
  }

  hasReturns(): boolean {
    // Only count processed returns
    return this.purchaseOrderReturns.length > 0;
  }

  hasProcessedReturns(): boolean {
    return this.purchaseOrderReturns.some(returnOrder => returnOrder.status === ReturnStatus.Processed);
  }

  getStatusText(status: PurchaseOrderStatus): string {
    switch (status) {
      case PurchaseOrderStatus.Draft:
        return 'Draft';
      case PurchaseOrderStatus.Pending:
        return 'Pending';
      case PurchaseOrderStatus.Approved:
        return 'Approved';
      case PurchaseOrderStatus.Sent:
        return 'Sent';
      case PurchaseOrderStatus.PartiallyReceived:
        return 'Partially Received';
      case PurchaseOrderStatus.Received:
        return 'Received';
      case PurchaseOrderStatus.PartiallyReturned:
        return 'Partially Returned';
      case PurchaseOrderStatus.Returned:
        return 'Returned';
      case PurchaseOrderStatus.Cancelled:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }
}

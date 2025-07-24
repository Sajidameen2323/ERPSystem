

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule, ArrowLeft, Edit, FileText, Truck, CheckCircle, XCircle, Clock, Package, RotateCcw, AlertTriangle } from 'lucide-angular';

import { PurchaseOrderService } from '../../shared/services/purchase-order.service';
import { PurchaseOrderReturnService } from '../../shared/services/purchase-order-return.service';
import { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderReturn, ReturnStatus } from '../../shared/models/purchase-order.interface';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule
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
    if (!confirm(`Mark purchase order ${po.poNumber} as Pending?`)) return;
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
    if (!confirm(`Send purchase order ${po.poNumber} to supplier?`)) return;
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
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;
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
    if (!confirm(`Mark all items in purchase order ${po.poNumber} as received?`)) return;
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
    const maxQty = item.orderedQuantity - item.receivedQuantity;
    let qtyStr = prompt(`Enter quantity to receive (max ${maxQty}):`, maxQty.toString());
    if (!qtyStr) return;
    let qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty < 1 || qty > maxQty) {
      alert('Invalid quantity.');
      return;
    }
    this.loading = true;
    this.error = null;
    const dto = { receivedQuantity: qty };
    this.purchaseOrderService.receiveItem(item.id, dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadPurchaseOrder(this.purchaseOrder!.id);
      },
      error: (err) => {
        this.error = err?.message || 'Failed to receive item.';
        this.loading = false;
      }
    });
  }

  approvePurchaseOrder(po: PurchaseOrder): void {
    if (!po || !this.canApprove(po.status)) return;
    if (!confirm(`Approve purchase order ${po.poNumber}?`)) return;
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
    private returnService: PurchaseOrderReturnService
  ) { }

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
            this.purchaseOrderReturns = result.data;
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
    return this.purchaseOrderReturns.length > 0;
  }
}

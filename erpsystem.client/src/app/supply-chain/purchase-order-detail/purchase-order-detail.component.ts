

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule, ArrowLeft, Edit, FileText, Truck, CheckCircle, XCircle, Clock, Package } from 'lucide-angular';

import { PurchaseOrderService } from '../../shared/services/purchase-order.service';
import { PurchaseOrder, PurchaseOrderStatus } from '../../shared/models/purchase-order.interface';

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
  loading = false;
  error: string | null = null;

  // Expose enum for template
  readonly PurchaseOrderStatus = PurchaseOrderStatus;

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly EditIcon = Edit;
  readonly FileTextIcon = FileText;
  readonly TruckIcon = Truck;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly ClockIcon = Clock;
  readonly PackageIcon = Package;
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
    private purchaseOrderService: PurchaseOrderService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPurchaseOrder(id);
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

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule, ArrowLeft, Edit, FileText, Truck, CheckCircle, XCircle } from 'lucide-angular';

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

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private purchaseOrderService: PurchaseOrderService
  ) {}

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

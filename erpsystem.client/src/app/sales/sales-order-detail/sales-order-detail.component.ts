import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

// Lucide Icons
import { LucideAngularModule, ArrowLeft, Edit, Trash2, Package, Calendar, DollarSign, User, FileText, Truck, RefreshCw } from 'lucide-angular';

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

  // Signals
  salesOrder = signal<SalesOrder | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  orderId = signal<string>('');
  showStatusUpdate = signal(false);

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
    this.router.navigate(['/dashboard/sales/orders', this.orderId(), 'edit']);
  }

  /**
   * Show status update component
   */
  updateStatus(): void {
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
}

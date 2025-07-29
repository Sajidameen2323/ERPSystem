import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs';

// Lucide Icons
import { 
  LucideAngularModule, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  RotateCcw, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ShoppingCart,
  TrendingUp,
  Plus,
  Eye,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star
} from 'lucide-angular';

// Services and Models
import { CustomerService } from '../services/customer.service';
import { SalesOrderService } from '../services/sales-order.service';
import { Customer } from '../models/customer.model';
import { SalesOrder, SalesOrderQueryParameters, SalesOrderStatus } from '../models/sales-order.model';

// Shared Components
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    LucideAngularModule,
    LoadingSpinnerComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.css']
})
export class CustomerDetailComponent implements OnInit, OnDestroy {
  private readonly customerService = inject(CustomerService);
  private readonly salesOrderService = inject(SalesOrderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly EditIcon = Edit;
  readonly Trash2Icon = Trash2;
  readonly RotateCcwIcon = RotateCcw;
  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly MapPinIcon = MapPin;
  readonly CalendarIcon = Calendar;
  readonly ShoppingCartIcon = ShoppingCart;
  readonly TrendingUpIcon = TrendingUp;
  readonly PlusIcon = Plus;
  readonly EyeIcon = Eye;
  readonly DollarSignIcon = DollarSign;
  readonly PackageIcon = Package;
  readonly ClockIcon = Clock;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly StarIcon = Star;

  // Signals for reactive state management
  loading = signal(false);
  error = signal<string | null>(null);
  customer = signal<Customer | null>(null);
  customerId = signal<string | null>(null);
  recentSalesOrders = signal<SalesOrder[]>([]);
  customerStats = signal({
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    lastOrderDate: null as Date | null
  });

  // Dialog states
  showDeleteDialog = signal(false);
  showRestoreDialog = signal(false);

  // Sales Order Status enum for template use
  readonly SalesOrderStatus = SalesOrderStatus;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customerId.set(id);
      this.loadCustomerData(id);
    } else {
      this.error.set('Customer ID not provided');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load customer details and related sales orders
   */
  private loadCustomerData(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Load customer and recent sales orders in parallel
    forkJoin({
      customer: this.customerService.getCustomerById(id),
      salesOrders: this.loadRecentSalesOrders(id)
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: ({ customer, salesOrders }) => {
        if (customer.isSuccess && customer.data) {
          this.customer.set(customer.data);
          this.recentSalesOrders.set(salesOrders.items || []);
          this.calculateCustomerStats(salesOrders.items || []);
        } else {
          this.error.set(customer.error || 'Customer not found');
        }
      },
      error: (error) => {
        console.error('Error loading customer data:', error);
        this.error.set('Failed to load customer data. Please try again.');
      }
    });
  }

  /**
   * Load recent sales orders for the customer
   */
  private loadRecentSalesOrders(customerId: string) {
    const params: SalesOrderQueryParameters = {
      page: 1,
      pageSize: 10,
      customerId: customerId,
      sortBy: 'orderDate',
      sortDescending: true
    };
    
    return this.salesOrderService.getSalesOrdersByCustomer(customerId, params);
  }

  /**
   * Calculate customer statistics from sales orders
   */
  private calculateCustomerStats(orders: SalesOrder[]): void {
    if (!orders || orders.length === 0) {
      this.customerStats.set({
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        lastOrderDate: null
      });
      return;
    }

    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingOrders = orders.filter(o => 
      o.status === SalesOrderStatus.New || 
      o.status === SalesOrderStatus.Processing
    ).length;
    const completedOrders = orders.filter(o => 
      o.status === SalesOrderStatus.Completed
    ).length;

    this.customerStats.set({
      totalOrders: orders.length,
      totalSpent: totalSpent,
      averageOrderValue: orders.length > 0 ? totalSpent / orders.length : 0,
      pendingOrders: pendingOrders,
      completedOrders: completedOrders,
      lastOrderDate: orders.length > 0 ? orders[0].orderDate : null
    });
  }

  /**
   * Navigate to edit page
   */
  editCustomer(): void {
    const customer = this.customer();
    if (customer) {
      this.router.navigate(['/dashboard/sales/customers', customer.id, 'edit']);
    }
  }

  /**
   * Open delete confirmation dialog
   */
  confirmDelete(): void {
    this.showDeleteDialog.set(true);
  }

  /**
   * Delete customer
   */
  deleteCustomer(): void {
    const customer = this.customer();
    if (!customer) return;

    this.loading.set(true);
    this.customerService.deleteCustomer(customer.id)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (result) => {
          if (result.isSuccess) {
            this.router.navigate(['/dashboard/sales/customers']);
          } else {
            this.error.set(result.error || 'Failed to delete customer');
            this.showDeleteDialog.set(false);
          }
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.error.set('Failed to delete customer. Please try again.');
          this.showDeleteDialog.set(false);
        }
      });
  }

  /**
   * Open restore confirmation dialog
   */
  confirmRestore(): void {
    this.showRestoreDialog.set(true);
  }

  /**
   * Restore customer
   */
  restoreCustomer(): void {
    const customer = this.customer();
    if (!customer) return;

    this.loading.set(true);
    this.customerService.restoreCustomer(customer.id)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (result) => {
          if (result.isSuccess) {
            // Reload customer to get updated data
            this.loadCustomerData(customer.id);
            this.showRestoreDialog.set(false);
          } else {
            this.error.set(result.error || 'Failed to restore customer');
            this.showRestoreDialog.set(false);
          }
        },
        error: (error) => {
          console.error('Error restoring customer:', error);
          this.error.set('Failed to restore customer. Please try again.');
          this.showRestoreDialog.set(false);
        }
      });
  }

  /**
   * Close dialogs
   */
  closeDialogs(): void {
    this.showDeleteDialog.set(false);
    this.showRestoreDialog.set(false);
  }

  /**
   * Navigate back to customer list
   */
  goBack(): void {
    this.router.navigate(['/dashboard/sales/customers']);
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get customer initials for avatar
   */
  getCustomerInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Create a new sales order for this customer
   */
  createSalesOrder(): void {
    const customer = this.customer();
    if (customer) {
      this.router.navigate(['/dashboard/sales/orders/new'], {
        queryParams: { customerId: customer.id }
      });
    }
  }

  /**
   * View all sales orders for this customer
   */
  viewAllSalesOrders(): void {
    const customer = this.customer();
    if (customer) {
      this.router.navigate(['/dashboard/sales/orders'], {
        queryParams: { customerId: customer.id }
      });
    }
  }

  /**
   * View a specific sales order
   */
  viewSalesOrder(orderId: string): void {
    this.router.navigate(['/dashboard/sales/orders', orderId]);
  }

  /**
   * Get status badge class for sales order status
   */
  getStatusBadgeClass(status: SalesOrderStatus): string {
    switch (status) {
      case SalesOrderStatus.New:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case SalesOrderStatus.Processing:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case SalesOrderStatus.Shipped:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case SalesOrderStatus.Completed:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case SalesOrderStatus.Cancelled:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case SalesOrderStatus.OnHold:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case SalesOrderStatus.Returned:
        return 'bg-red-100 text-gray-800 dark:bg-red-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  /**
   * Get status display text
   */
  getStatusText(status: SalesOrderStatus): string {
    switch (status) {
      case SalesOrderStatus.New:
        return 'New';
      case SalesOrderStatus.Processing:
        return 'Processing';
      case SalesOrderStatus.Shipped:
        return 'Shipped';
      case SalesOrderStatus.Completed:
        return 'Completed';
      case SalesOrderStatus.Cancelled:
        return 'Cancelled';
      case SalesOrderStatus.OnHold:
        return 'On Hold';
      case SalesOrderStatus.Returned:
        return 'Returned';
      default:
        return 'Unknown';
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

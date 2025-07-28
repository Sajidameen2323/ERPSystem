import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// Lucide Icons
import { LucideAngularModule, Search, Plus, Edit, Trash2, RotateCcw, Eye, Filter, Download, Package, Calendar, DollarSign, RefreshCw } from 'lucide-angular';

// Services and Models
import { SalesOrderService } from '../services/sales-order.service';
import { SalesOrder, SalesOrderQueryParameters, SalesOrderStatus, getStatusLabel, getStatusColor } from '../models/sales-order.model';

// Shared Components
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SalesOrderStatusUpdateComponent } from '../sales-order-status-update/sales-order-status-update.component';

@Component({
  selector: 'app-sales-order-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    LucideAngularModule,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    SalesOrderStatusUpdateComponent
  ],
  templateUrl: './sales-order-list.component.html',
  styleUrls: ['./sales-order-list.component.css']
})
export class SalesOrderListComponent implements OnInit {
  private readonly salesOrderService = inject(SalesOrderService);

  // Expose utilities for template
  readonly Math = Math;
  readonly getStatusLabel = getStatusLabel;
  readonly getStatusColor = getStatusColor;
  readonly SalesOrderStatus = SalesOrderStatus;

  // Icons
  readonly SearchIcon = Search;
  readonly PlusIcon = Plus;
  readonly EditIcon = Edit;
  readonly Trash2Icon = Trash2;
  readonly RotateCcwIcon = RotateCcw;
  readonly EyeIcon = Eye;
  readonly FilterIcon = Filter;
  readonly DownloadIcon = Download;
  readonly PackageIcon = Package;
  readonly CalendarIcon = Calendar;
  readonly DollarSignIcon = DollarSign;
  readonly RefreshCwIcon = RefreshCw;

  // Signals for reactive state management
  salesOrders = signal<SalesOrder[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Pagination and filtering
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);
  searchTerm = signal('');
  sortBy = signal('orderDate');
  sortDescending = signal(true);
  includeDeleted = signal(false);
  onlyInactive = signal(false);
  
  // Advanced filters
  selectedStatus = signal<SalesOrderStatus | null>(null);
  selectedCustomerId = signal<string>('');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  // Computed values
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  salesOrderList = computed(() => this.salesOrders() || []);
  hasSalesOrders = computed(() => this.salesOrderList().length > 0);
  showingInactiveOnly = computed(() => this.onlyInactive());
  showingDeletedAndActive = computed(() => this.includeDeleted() && !this.onlyInactive());
  
  // Dialog states
  showDeleteDialog = signal(false);
  showRestoreDialog = signal(false);
  showStatusUpdateDialog = signal(false);
  selectedSalesOrder = signal<SalesOrder | null>(null);
  showAdvancedFilters = false;

  // Filter options
  sortOptions = [
    { value: 'orderDate', label: 'Order Date' },
    { value: 'customer', label: 'Customer' },
    { value: 'status', label: 'Status' },
    { value: 'totalAmount', label: 'Total Amount' },
    { value: 'referenceNumber', label: 'Reference Number' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' }
  ];

  statusOptions = [
    { value: SalesOrderStatus.New, label: getStatusLabel(SalesOrderStatus.New) },
    { value: SalesOrderStatus.Processing, label: getStatusLabel(SalesOrderStatus.Processing) },
    { value: SalesOrderStatus.Shipped, label: getStatusLabel(SalesOrderStatus.Shipped) },
    { value: SalesOrderStatus.Completed, label: getStatusLabel(SalesOrderStatus.Completed) },
    { value: SalesOrderStatus.Cancelled, label: getStatusLabel(SalesOrderStatus.Cancelled) },
    { value: SalesOrderStatus.Returned, label: getStatusLabel(SalesOrderStatus.Returned) },
    { value: SalesOrderStatus.OnHold, label: getStatusLabel(SalesOrderStatus.OnHold) }
  ];

  // Business Rules
  /**
   * Check if a sales order can be updated
   * Orders can only be updated when status is New or Processing
   */
  canUpdateOrder(order: SalesOrder): boolean {
    if (order.isDeleted) return false;
    return order.status === SalesOrderStatus.New || order.status === SalesOrderStatus.Processing;
  }

  /**
   * Check if a sales order can be deleted
   * Orders can only be deleted when status is New or Processing
   */
  canDeleteOrder(order: SalesOrder): boolean {
    if (order.isDeleted) return false;
    return order.status === SalesOrderStatus.New || order.status === SalesOrderStatus.Processing;
  }

  /**
   * Get tooltip text explaining why an action is disabled
   */
  getDisabledTooltip(order: SalesOrder, action: 'update' | 'delete'): string {
    if (order.isDeleted) {
      return 'Cannot perform this action on deleted orders';
    }
    
    const statusLabel = getStatusLabel(order.status);
    if (action === 'update') {
      return `Cannot update orders with status "${statusLabel}". Only "New" and "Processing" orders can be updated.`;
    } else {
      return `Cannot delete orders with status "${statusLabel}". Only "New" and "Processing" orders can be deleted.`;
    }
  }

  ngOnInit(): void {
    this.loadSalesOrders();
  }

  /**
   * Load sales orders with current filter parameters
   */
  loadSalesOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: SalesOrderQueryParameters = {
      searchTerm: this.searchTerm() || undefined,
      sortBy: this.sortBy(),
      sortDescending: this.sortDescending(),
      page: this.currentPage(),
      pageSize: this.pageSize(),
      includeDeleted: this.onlyInactive() ? true : this.includeDeleted(),
      onlyInactive: this.onlyInactive(),
      status: this.selectedStatus() ?? undefined,
      customerId: this.selectedCustomerId() || undefined,
      orderDateFrom: this.dateFrom() ? new Date(this.dateFrom()) : undefined,
      orderDateTo: this.dateTo() ? new Date(this.dateTo()) : undefined
    };

    this.salesOrderService.getSalesOrders(params)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (result) => {
          console.log('Sales orders loaded:', result.items);
          let salesOrders = result.items;
          
          // Filter to show only inactive orders if the filter is enabled
          if (this.onlyInactive()) {
            salesOrders = salesOrders.filter(order => order.isDeleted);
          }
          
          this.salesOrders.set(salesOrders);
          this.totalCount.set(this.onlyInactive() ? salesOrders.length : result.totalCount);
        },
        error: (error) => {
          console.error('Error loading sales orders:', error);
          this.error.set('Failed to load sales orders. Please try again.');
        }
      });
  }

  /**
   * Handle search input changes
   */
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.currentPage.set(1); // Reset to first page
    this.loadSalesOrders();
  }

  /**
   * Handle sort changes
   */
  onSortChange(): void {
    this.currentPage.set(1); // Reset to first page
    this.loadSalesOrders();
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.currentPage.set(1); // Reset to first page
    this.loadSalesOrders();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set(null);
    this.selectedCustomerId.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.includeDeleted.set(false);
    this.onlyInactive.set(false);
    this.currentPage.set(1);
    this.loadSalesOrders();
  }

  /**
   * Toggle sort direction
   */
  toggleSortDirection(): void {
    this.sortDescending.set(!this.sortDescending());
    this.loadSalesOrders();
  }

  /**
   * Handle page changes
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadSalesOrders();
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages());
  }

  /**
   * Handle page size changes
   */
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(parseInt(target.value));
    this.currentPage.set(1);
    this.loadSalesOrders();
  }

  /**
   * Show delete confirmation dialog
   */
  confirmDelete(salesOrder: SalesOrder): void {
    // Check if order can be deleted
    if (!this.canDeleteOrder(salesOrder)) {
      this.error.set(this.getDisabledTooltip(salesOrder, 'delete'));
      return;
    }
    
    this.selectedSalesOrder.set(salesOrder);
    this.showDeleteDialog.set(true);
  }

  /**
   * Delete a sales order
   */
  deleteSalesOrder(): void {
    const salesOrder = this.selectedSalesOrder();
    if (!salesOrder) return;

    this.loading.set(true);
    this.salesOrderService.deleteSalesOrder(salesOrder.id)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.showDeleteDialog.set(false);
          this.selectedSalesOrder.set(null);
          this.loadSalesOrders();
        },
        error: (error) => {
          console.error('Error deleting sales order:', error);
          this.error.set('Failed to delete sales order. Please try again.');
        }
      });
  }

  /**
   * Show restore confirmation dialog
   */
  confirmRestore(salesOrder: SalesOrder): void {
    this.selectedSalesOrder.set(salesOrder);
    this.showRestoreDialog.set(true);
  }

  /**
   * Restore a sales order
   */
  restoreSalesOrder(): void {
    const salesOrder = this.selectedSalesOrder();
    if (!salesOrder) return;

    this.loading.set(true);
    this.salesOrderService.restoreSalesOrder(salesOrder.id)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.showRestoreDialog.set(false);
          this.selectedSalesOrder.set(null);
          this.loadSalesOrders();
        },
        error: (error) => {
          console.error('Error restoring sales order:', error);
          this.error.set('Failed to restore sales order. Please try again.');
        }
      });
  }

  /**
   * Show status update confirmation dialog
   */
  updateOrderStatus(salesOrder: SalesOrder): void {
    // Check if order can be updated
    if (!this.canUpdateOrder(salesOrder)) {
      this.error.set(this.getDisabledTooltip(salesOrder, 'update'));
      return;
    }
    
    this.selectedSalesOrder.set(salesOrder);
    this.showStatusUpdateDialog.set(true);
  }

  /**
   * Handle status update completion
   */
  onStatusUpdated(): void {
    this.showStatusUpdateDialog.set(false);
    this.selectedSalesOrder.set(null);
    this.loadSalesOrders(); // Refresh the list to show updated status
  }

  /**
   * Cancel dialog
   */
  cancelDialog(): void {
    this.showDeleteDialog.set(false);
    this.showRestoreDialog.set(false);
    this.showStatusUpdateDialog.set(false);
    this.selectedSalesOrder.set(null);
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
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}

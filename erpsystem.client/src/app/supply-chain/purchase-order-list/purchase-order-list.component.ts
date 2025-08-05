import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule, Plus, Search, Edit, Eye, FileText, Truck, CheckCircle, Clock, RotateCcw } from 'lucide-angular';

import { PurchaseOrderService } from '../../shared/services/purchase-order.service';
import { SupplierService } from '../../shared/services/supplier.service';
import { PurchaseOrder, PurchaseOrderQueryParameters, PurchaseOrderStatus } from '../../shared/models/purchase-order.interface';
import { Supplier } from '../../shared/models/supplier.interface';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    ConfirmationModalComponent
  ],
  templateUrl: './purchase-order-list.component.html',
  styleUrl: './purchase-order-list.component.css'
})
export class PurchaseOrderListComponent implements OnInit, OnDestroy {
  purchaseOrders: PurchaseOrder[] = [];
  suppliers: Supplier[] = [];
  loading = false;
  error: string | null = null;
  
  // Confirmation modal properties
  showConfirmationModal = false;
  confirmationConfig: ConfirmationConfig = {
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning'
  };
  pendingAction: { type: string; id: string } | null = null;

  // Expose Math and enum for template
  readonly Math = Math;
  readonly PurchaseOrderStatus = PurchaseOrderStatus;

  // Icons
  readonly PlusIcon = Plus;
  readonly SearchIcon = Search;
  readonly EditIcon = Edit;
  readonly EyeIcon = Eye;
  readonly FileTextIcon = FileText;
  readonly TruckIcon = Truck;
  readonly CheckCircleIcon = CheckCircle;
  readonly ClockIcon = Clock;
  readonly RotateCcwIcon = RotateCcw;


  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // Search and filters
  searchTerm = '';
  searchSubject = new Subject<string>();
  selectedStatus: PurchaseOrderStatus | '' = '';
  selectedSupplierId = '';
  sortBy = 'orderDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  private destroy$ = new Subject<void>();

  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private supplierService: SupplierService
  ) { }

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadSuppliers();
    this.loadPurchaseOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchTerm = searchTerm;
        this.currentPage = 1;
        this.loadPurchaseOrders();
      });
  }

  loadSuppliers(): void {
    this.supplierService.getActiveSuppliersForSelection()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (suppliers) => {
          this.suppliers = suppliers;
        },
        error: (error) => {
          console.error('Error loading suppliers:', error);
        }
      });
  }

  loadPurchaseOrders(): void {
    this.loading = true;
    this.error = null;

    const params: PurchaseOrderQueryParameters = {
      page: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      status: this.selectedStatus || undefined,
      supplierId: this.selectedSupplierId || undefined,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.purchaseOrderService.getPurchaseOrders(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.purchaseOrders = response.items;
          this.totalItems = response.totalCount;
          this.totalPages = response.totalPages;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load purchase orders. Please try again.';
          this.loading = false;
          console.error('Error loading purchase orders:', error);
        }
      });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadPurchaseOrders();
  }

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadPurchaseOrders();
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return '';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPurchaseOrders();
    }
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);

    let start = Math.max(1, this.currentPage - halfRange);
    let end = Math.min(this.totalPages, start + maxPagesToShow - 1);

    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getStatusOptions(): { value: PurchaseOrderStatus | ''; label: string }[] {
    return [
      { value: '', label: 'All Statuses' },
      ...this.purchaseOrderService.getStatusOptions()
    ];
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

  hasReturnStatus(status: PurchaseOrderStatus): boolean {
    return status === PurchaseOrderStatus.PartiallyReturned || status === PurchaseOrderStatus.Returned;
  }

  getReturnStatusText(status: PurchaseOrderStatus): string {
    switch (status) {
      case PurchaseOrderStatus.PartiallyReturned:
        return 'Partially Returned';
      case PurchaseOrderStatus.Returned:
        return 'Fully Returned';
      default:
        return '';
    }
  }

  getReturnStatusBadgeClass(status: PurchaseOrderStatus): string {
    switch (status) {
      case PurchaseOrderStatus.PartiallyReturned:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      case PurchaseOrderStatus.Returned:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return '';
    }
  }

  approvePurchaseOrder(purchaseOrder: PurchaseOrder): void {
    this.confirmationConfig = {
      title: 'Approve Purchase Order',
      message: `Are you sure you want to approve purchase order ${purchaseOrder.poNumber}?`,
      confirmText: 'Approve',
      cancelText: 'Cancel',
      type: 'info'
    };
    this.pendingAction = { type: 'approve', id: purchaseOrder.id };
    this.showConfirmationModal = true;
  }

  /**
   * Returns true if the purchase order can be marked as pending (Draft status only)
   */
  canMarkPending(status: PurchaseOrderStatus): boolean {
    return this.purchaseOrderService.canMarkPending(status);
  }

  /**
   * Mark the purchase order as Pending (calls backend and updates UI)
   */
  markAsPending(po: PurchaseOrder): void {
    if (!po || po.status !== PurchaseOrderStatus.Draft) return;
    
    this.confirmationConfig = {
      title: 'Mark as Pending',
      message: `Are you sure you want to mark purchase order ${po.poNumber} as Pending?`,
      confirmText: 'Mark as Pending',
      cancelText: 'Cancel',
      type: 'warning'
    };
    this.pendingAction = { type: 'markAsPending', id: po.id };
    this.showConfirmationModal = true;
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
      month: 'short',
      day: 'numeric'
    }).format(date);
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

  onConfirmationConfirmed(): void {
    this.showConfirmationModal = false;
    
    if (!this.pendingAction) return;
    
    this.loading = true;
    this.error = null;
    
    switch (this.pendingAction.type) {
      case 'markAsPending':
        this.purchaseOrderService.markAsPending(this.pendingAction.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadPurchaseOrders();
            },
            error: (err) => {
              this.error = err?.message || 'Failed to mark as pending.';
              this.loading = false;
            }
          });
        break;
      case 'approve':
        this.purchaseOrderService.approvePurchaseOrder(this.pendingAction.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadPurchaseOrders();
              console.log('Purchase order approved successfully');
            },
            error: (error) => {
              this.error = 'Failed to approve purchase order';
              console.error('Error approving purchase order:', error);
              this.loading = false;
            }
          });
        break;
      // Add more cases here for other actions
    }
    
    this.pendingAction = null;
  }

  onConfirmationCancelled(): void {
    this.showConfirmationModal = false;
    this.pendingAction = null;
  }
}

import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  FileText, 
  Search, 
  ArrowDownUp, 
  ArrowDown, 
  ArrowUp, 
  RefreshCcw,
  Filter,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Eye
} from 'lucide-angular';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, of, catchError, switchMap } from 'rxjs';

import { StockMovement, StockMovementType } from '../../shared/models/purchase-order.interface';
import { PurchaseOrderService } from '../../shared/services/purchase-order.service';
import { ThemeService } from '../../shared/services/theme.service';
import { LayoutService } from '../../shared/services/layout.service';
import { StockMovementModalComponent } from '../../shared/components/stock-movement-modal/stock-movement-modal.component';

@Component({
  selector: 'app-stock-movement-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule, StockMovementModalComponent],
  templateUrl: './stock-movement-list.component.html',
  styleUrl: './stock-movement-list.component.css'
})
export class StockMovementListComponent implements OnInit, OnDestroy {
  // Injected services
  private purchaseOrderService = inject(PurchaseOrderService);
  public themeService = inject(ThemeService);
  public layoutService = inject(LayoutService);

  // State signals
  stockMovements = signal<StockMovement[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Filter and pagination signals
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  searchTerm = signal('');
  selectedType = signal<StockMovementType | ''>('');
  sortBy = signal('movementDate');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Date range filter signals
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  // Modal state signals
  showViewModal = signal(false);
  selectedMovement = signal<StockMovement | null>(null);

  // Computed values
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  hasNextPage = computed(() => this.currentPage() < this.totalPages());
  hasPreviousPage = computed(() => this.currentPage() > 1);
  
  // Check if any filters are active
  hasActiveFilters = computed(() => 
    this.searchTerm() || 
    this.selectedType() || 
    this.dateFrom() || 
    this.dateTo()
  );

  // Icons
  readonly FileTextIcon = FileText;
  readonly SearchIcon = Search;
  readonly ArrowDownUpIcon = ArrowDownUp;
  readonly ArrowDownIcon = ArrowDown;
  readonly ArrowUpIcon = ArrowUp;
  readonly RefreshCcwIcon = RefreshCcw;
  readonly FilterIcon = Filter;
  readonly CalendarIcon = Calendar;
  readonly PackageIcon = Package;
  readonly TrendingUpIcon = TrendingUp;
  readonly TrendingDownIcon = TrendingDown;
  readonly RotateCcwIcon = RotateCcw;
  readonly EyeIcon = Eye;

  // Expose Math for template
  readonly Math = Math;

  // Search debouncing
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadStockMovements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup search debouncing to avoid excessive API calls
   */
  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchTerm.set(searchTerm);
        this.currentPage.set(1);
        this.loadStockMovements();
      });
  }

  /**
   * Load stock movements with current filters and pagination
   */
  loadStockMovements(): void {
    this.loading.set(true);
    this.error.set(null);

    const params = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      searchTerm: this.searchTerm() || undefined,
      movementType: this.selectedType() || undefined,
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined
    };

    this.purchaseOrderService.getStockMovements(params)
      .pipe(
        catchError(error => {
          this.error.set(error?.message || 'Failed to load stock movements. Please try again.');
          this.loading.set(false);
          console.error('Error loading stock movements:', error);
          return of({ items: [], totalCount: 0, currentPage: 1, pageSize: 10, totalPages: 0 });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.stockMovements.set(response.items || []);
          this.totalCount.set(response.totalCount || 0);
          this.loading.set(false);
        }
      });
  }

  /**
   * Handle search input with debouncing
   */
  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  /**
   * Handle movement type filter change
   */
  onTypeFilterChange(): void {
    this.currentPage.set(1);
    this.loadStockMovements();
  }

  /**
   * Handle date filter changes
   */
  onDateFilterChange(): void {
    this.currentPage.set(1);
    this.loadStockMovements();
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(parseInt(target.value));
    this.currentPage.set(1);
    this.loadStockMovements();
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadStockMovements();
    }
  }

  /**
   * Handle sorting
   */
  onSort(column: string): void {
    if (this.sortBy() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
    this.loadStockMovements();
  }

  /**
   * Get sort icon for table headers
   */
  getSortIcon(column: string): string {
    if (this.sortBy() !== column) return '';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedType.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
    this.loadStockMovements();
  }

  /**
   * Refresh data
   */
  onRefresh(): void {
    this.loadStockMovements();
  }

  /**
   * Get movement type options for filter dropdown
   */
  getMovementTypeOptions(): { value: string; label: string }[] {
    return [
      { value: '', label: 'All Types' },
      { value: 'Purchase', label: 'Purchase' },
      { value: 'Sale', label: 'Sale' },
      { value: 'Adjustment', label: 'Adjustment' },
      { value: 'Transfer', label: 'Transfer' },
      { value: 'Return', label: 'Return' },
      { value: 'Damage', label: 'Damage' }
    ];
  }

  /**
   * Get theme classes for styling
   */
  get themeClasses() {
    return this.themeService.getClasses();
  }

  /**
   * Generate pagination page numbers
   */
  getPaginationPages(): number[] {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const pages: number[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination with ellipsis
      if (currentPage <= 4) {
        // Show first 5 pages
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis indicator
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Show last 5 pages
        pages.push(1);
        pages.push(-1); // Ellipsis indicator
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show pages around current page
        pages.push(1);
        pages.push(-1); // Ellipsis indicator
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-2); // Ellipsis indicator
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

  /**
   * Open view modal for a stock movement
   */
  openViewModal(movement: StockMovement): void {
    this.selectedMovement.set(movement);
    this.showViewModal.set(true);
  }

  /**
   * Close view modal
   */
  closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedMovement.set(null);
  }

  /**
   * Check if movement decreases stock
   */
  isStockDecrease(movementType: string): boolean {
    return ['sale', 'sold', 'damage', 'damaged', 'stockout', 'expired', 'return'].includes(movementType?.toLowerCase());
  }
}

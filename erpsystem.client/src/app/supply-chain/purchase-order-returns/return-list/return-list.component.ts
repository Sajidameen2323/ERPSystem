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
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw
} from 'lucide-angular';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, of, catchError, switchMap } from 'rxjs';

import { 
  PurchaseOrderReturn, 
  PurchaseOrderReturnFilters,
  ReturnStatus 
} from '../../../shared/models/purchase-order.interface';
import { PurchaseOrderReturnService } from '../../../shared/services/purchase-order-return.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { LayoutService } from '../../../shared/services/layout.service';

@Component({
  selector: 'app-return-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './return-list.component.html',
  styleUrl: './return-list.component.css'
})
export class ReturnListComponent implements OnInit, OnDestroy {
  // Injected services
  private returnService = inject(PurchaseOrderReturnService);
  public themeService = inject(ThemeService);
  public layoutService = inject(LayoutService);

  // State signals
  returns = signal<PurchaseOrderReturn[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Filter and pagination signals
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  searchTerm = signal('');
  selectedStatus = signal<string | number>('');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  // Computed properties
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  hasNextPage = computed(() => this.currentPage() < this.totalPages());
  hasPreviousPage = computed(() => this.currentPage() > 1);
  themeClasses = computed(() => this.themeService.getClasses());

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
  readonly PlusIcon = Plus;
  readonly EyeIcon = Eye;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly ClockIcon = Clock;
  readonly RotateCcwIcon = RotateCcw;

  // Enum references for template
  readonly ReturnStatus = ReturnStatus;

  // Reactive streams
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Math for pagination
  Math = Math;

  ngOnInit(): void {
    this.setupSearch();
    this.loadReturns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm.set(searchTerm);
      this.currentPage.set(1);
      this.loadReturns();
    });
  }

  loadReturns(): void {
    this.loading.set(true);
    this.error.set(null);

    // Convert selectedStatus to proper ReturnStatus enum value
    let statusFilter: ReturnStatus | undefined;
    const selectedStatusValue = this.selectedStatus();
    if (selectedStatusValue !== '' && selectedStatusValue !== null && selectedStatusValue !== undefined) {
      // If it's a string, convert to number, otherwise use as is
      const statusNumber = typeof selectedStatusValue === 'string' ? 
        parseInt(selectedStatusValue) : selectedStatusValue;
      if (!isNaN(statusNumber)) {
        statusFilter = statusNumber as ReturnStatus;
      }
    }

    const filters: PurchaseOrderReturnFilters = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      search: this.searchTerm() || undefined,
      status: statusFilter,
      dateFrom: this.dateFrom() ? new Date(this.dateFrom()) : undefined,
      dateTo: this.dateTo() ? new Date(this.dateTo()) : undefined
    };

    this.returnService.getReturns(filters).pipe(
      catchError(error => {
        console.error('Error loading returns:', error);
        this.error.set('Failed to load returns. Please try again.');
        return of({ items: [], totalCount: 0, currentPage: 1, pageSize: 10 });
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.returns.set(result.items);
      this.totalCount.set(result.totalCount);
      this.loading.set(false);
    });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onStatusFilterChange(): void {
    this.currentPage.set(1);
    this.loadReturns();
  }

  onDateFilterChange(): void {
    this.currentPage.set(1);
    this.loadReturns();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadReturns();
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(parseInt(target.value));
    this.currentPage.set(1);
    this.loadReturns();
  }

  onRefresh(): void {
    this.loadReturns();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
    this.loadReturns();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm() || this.selectedStatus() || this.dateFrom() || this.dateTo());
  }

  getReturnStatusOptions() {
    return this.returnService.getReturnStatusOptions();
  }

  getStatusBadgeClass(status: ReturnStatus): string {
    return this.returnService.getStatusBadgeClass(status);
  }

  getStatusText(status: ReturnStatus): string {
    return this.returnService.getStatusText(status);
  }

  getPaginationPages(): number[] {
    const currentPage = this.currentPage();
    const totalPages = this.totalPages();
    const pages: number[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 4) {
        // Near the beginning
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis indicator
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near the end
        pages.push(-1); // Ellipsis indicator
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
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

  approveReturn(returnItem: PurchaseOrderReturn): void {
    if (returnItem.status !== ReturnStatus.Pending) {
      return;
    }

    this.loading.set(true);
    
    this.returnService.approveReturn(returnItem.id, {
      notes: 'Approved via return list'
    }).pipe(
      catchError(error => {
        console.error('Error approving return:', error);
        this.error.set('Failed to approve return. Please try again.');
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.loading.set(false);
      if (result?.data) {
        // Update the return in the list
        const updatedReturns = this.returns().map(r => 
          r.id === result.data!.id ? result.data! : r
        );
        this.returns.set(updatedReturns);
      }
    });
  }

  cancelReturn(returnItem: PurchaseOrderReturn): void {
    if (returnItem.status !== ReturnStatus.Pending) {
      return;
    }

    this.loading.set(true);
    
    this.returnService.cancelReturn(returnItem.id, {
      notes: 'Cancelled via return list'
    }).pipe(
      catchError(error => {
        console.error('Error cancelling return:', error);
        this.error.set('Failed to cancel return. Please try again.');
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.loading.set(false);
      if (result?.data) {
        // Update the return in the list
        const updatedReturns = this.returns().map(r => 
          r.id === result.data!.id ? result.data! : r
        );
        this.returns.set(updatedReturns);
      }
    });
  }
}

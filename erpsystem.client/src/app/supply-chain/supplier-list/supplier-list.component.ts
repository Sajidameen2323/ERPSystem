import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule, Plus, Search, Edit, Trash2, Eye, CheckCircle, XCircle } from 'lucide-angular';

import { SupplierService } from '../../shared/services/supplier.service';
import { Supplier, SupplierQueryParameters } from '../../shared/models/supplier.interface';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule
  ],
  templateUrl: './supplier-list.component.html',
  styleUrl: './supplier-list.component.css'
})
export class SupplierListComponent implements OnInit, OnDestroy {
  suppliers: Supplier[] = [];
  loading = false;
  error: string | null = null;

  // Expose Math for template
  readonly Math = Math;

  // Icons
  readonly PlusIcon = Plus;
  readonly SearchIcon = Search;
  readonly EditIcon = Edit;
  readonly TrashIcon = Trash2;
  readonly EyeIcon = Eye;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // Search and filters
  searchTerm = '';
  searchSubject = new Subject<string>();
  selectedCountry = '';
  activeFilter: boolean | undefined = undefined;
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Countries for filter
  countries = [
    'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 
    'Italy', 'Spain', 'Netherlands', 'Australia', 'Japan', 'China', 'India'
  ];

  private destroy$ = new Subject<void>();

  constructor(private supplierService: SupplierService) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadSuppliers();
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
        this.loadSuppliers();
      });
  }

  loadSuppliers(): void {
    this.loading = true;
    this.error = null;

    const params: SupplierQueryParameters = {
      page: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      country: this.selectedCountry || undefined,
      isActive: this.activeFilter,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.supplierService.getSuppliers(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.suppliers = response.data?.items || [];
          this.totalItems = response.data?.totalCount || 0;
          this.totalPages = response.data?.totalPages || 0;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load suppliers. Please try again.';
          this.loading = false;
          console.error('Error loading suppliers:', error);
        }
      });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onCountryChange(): void {
    this.currentPage = 1;
    this.loadSuppliers();
  }

  onActiveFilterChange(): void {
    this.currentPage = 1;
    this.loadSuppliers();
  }

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadSuppliers();
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return '';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadSuppliers();
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

  toggleSupplierStatus(supplier: Supplier): void {
    if (supplier.isActive) {
      this.deactivateSupplier(supplier);
    } else {
      this.activateSupplier(supplier);
    }
  }

  activateSupplier(supplier: Supplier): void {
    this.supplierService.activateSupplier(supplier.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          supplier.isActive = true;
          console.log('Supplier activated successfully');
        },
        error: (error) => {
          this.error = 'Failed to activate supplier';
          console.error('Error activating supplier:', error);
        }
      });
  }

  deactivateSupplier(supplier: Supplier): void {
    if (confirm('Are you sure you want to deactivate this supplier?')) {
      this.supplierService.deactivateSupplier(supplier.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            supplier.isActive = false;
            console.log('Supplier deactivated successfully');
          },
          error: (error) => {
            this.error = 'Failed to deactivate supplier';
            console.error('Error deactivating supplier:', error);
          }
        });
    }
  }

  deleteSupplier(supplier: Supplier): void {
    if (confirm(`Are you sure you want to delete supplier "${supplier.name}"? This action cannot be undone.`)) {
      this.supplierService.deleteSupplier(supplier.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadSuppliers();
            console.log('Supplier deleted successfully');
          },
          error: (error) => {
            this.error = 'Failed to delete supplier';
            console.error('Error deleting supplier:', error);
          }
        });
    }
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

  getPerformanceRatingClass(rating?: number): string {
    if (!rating) return 'text-gray-400';
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  }
}

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// Lucide Icons
import { LucideAngularModule, Search, Plus, Edit, Trash2, RotateCcw, Eye, Filter, Download } from 'lucide-angular';

// Services and Models
import { CustomerService } from '../services/customer.service';
import { Customer, CustomerQueryParameters } from '../models/customer.model';

// Shared Components
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    LucideAngularModule,
    LoadingSpinnerComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  private readonly customerService = inject(CustomerService);

  // Expose Math for template
  readonly Math = Math;

  // Icons
  readonly SearchIcon = Search;
  readonly PlusIcon = Plus;
  readonly EditIcon = Edit;
  readonly Trash2Icon = Trash2;
  readonly RotateCcwIcon = RotateCcw;
  readonly EyeIcon = Eye;
  readonly FilterIcon = Filter;
  readonly DownloadIcon = Download;

  // Signals for reactive state management
  customers = signal<Customer[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Pagination and filtering
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);
  searchTerm = signal('');
  sortBy = signal('name');
  sortDescending = signal(false);
  includeDeleted = signal(false);
  onlyInactive = signal(false);

  // Computed values
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  customerList = computed(() => this.customers() || []);
  hasCustomers = computed(() => this.customerList().length > 0);
  showingInactiveOnly = computed(() => this.onlyInactive());
  showingDeletedAndActive = computed(() => this.includeDeleted() && !this.onlyInactive());
  
  // Dialog states
  showDeleteDialog = signal(false);
  showRestoreDialog = signal(false);
  selectedCustomer = signal<Customer | null>(null);

  // Filter options
  sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' }
  ];

  ngOnInit(): void {
    this.loadCustomers();
  }

  /**
   * Load customers with current filter parameters
   */
  loadCustomers(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: CustomerQueryParameters = {
      searchTerm: this.searchTerm() || undefined,
      sortBy: this.sortBy(),
      sortDescending: this.sortDescending(),
      page: this.currentPage(),
      pageSize: this.pageSize(),
      includeDeleted: this.onlyInactive() ? true : this.includeDeleted(),
      onlyInactive: this.onlyInactive()
    };

    this.customerService.getCustomers(params)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (apiResult) => {
          if (apiResult.isSuccess && apiResult.data) {
            console.log('Customers loaded:', apiResult.data.items);
            let customers = apiResult.data.items;
            
            // Filter to show only inactive customers if the filter is enabled
            if (this.onlyInactive()) {
              customers = customers.filter(customer => customer.isDeleted);
            }
            
            this.customers.set(customers);
            this.totalCount.set(this.onlyInactive() ? customers.length : apiResult.data.totalCount);
          } else {
            console.error('API returned error:', apiResult.error);
            this.error.set(apiResult.error || 'Failed to load customers');
          }
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          this.error.set('Failed to load customers. Please try again.');
        }
      });
  }

  /**
   * Handle search input changes with debouncing
   */
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.currentPage.set(1); // Reset to first page
    this.loadCustomers();
  }

  /**
   * Handle sort changes
   */
  onSortChange(): void {
    this.currentPage.set(1); // Reset to first page
    this.loadCustomers();
  }

  /**
   * Toggle sort direction
   */
  toggleSortDirection(): void {
    this.sortDescending.set(!this.sortDescending());
    this.onSortChange();
  }

  /**
   * Handle page size changes
   */
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(parseInt(target.value));
    this.currentPage.set(1); // Reset to first page
    this.loadCustomers();
  }

  /**
   * Toggle include deleted filter
   */
  toggleIncludeDeleted(): void {
    this.includeDeleted.set(!this.includeDeleted());
    // Reset onlyInactive when toggling includeDeleted
    if (this.onlyInactive()) {
      this.onlyInactive.set(false);
    }
    this.currentPage.set(1); // Reset to first page
    this.loadCustomers();
  }

  /**
   * Toggle only inactive customers filter
   */
  toggleOnlyInactive(): void {
    this.onlyInactive.set(!this.onlyInactive());
    // Reset includeDeleted when toggling onlyInactive
    if (this.includeDeleted()) {
      this.includeDeleted.set(false);
    }
    this.currentPage.set(1); // Reset to first page
    this.loadCustomers();
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadCustomers();
    }
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, -1, total);
      } else if (current >= total - 3) {
        pages.push(1, -1, total - 4, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, -1, current - 1, current, current + 1, -1, total);
      }
    }

    return pages;
  }

  /**
   * Open delete confirmation dialog
   */
  confirmDelete(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.showDeleteDialog.set(true);
  }

  /**
   * Delete customer
   */
  deleteCustomer(): void {
    const customer = this.selectedCustomer();
    if (!customer) return;

    this.loading.set(true);
    this.customerService.deleteCustomer(customer.id)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (result) => {
          if (result.isSuccess) {
            this.loadCustomers(); // Reload the list
            this.showDeleteDialog.set(false);
            this.selectedCustomer.set(null);
          } else {
            this.error.set(result.error || 'Failed to delete customer');
          }
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.error.set('Failed to delete customer. Please try again.');
        }
      });
  }

  /**
   * Open restore confirmation dialog
   */
  confirmRestore(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.showRestoreDialog.set(true);
  }

  /**
   * Restore customer
   */
  restoreCustomer(): void {
    const customer = this.selectedCustomer();
    if (!customer) return;

    this.loading.set(true);
    this.customerService.restoreCustomer(customer.id)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (result) => {
          if (result.isSuccess) {
            this.loadCustomers(); // Reload the list
            this.showRestoreDialog.set(false);
            this.selectedCustomer.set(null);
          } else {
            this.error.set(result.error || 'Failed to restore customer');
          }
        },
        error: (error) => {
          console.error('Error restoring customer:', error);
          this.error.set('Failed to restore customer. Please try again.');
        }
      });
  }

  /**
   * Close dialogs
   */
  closeDialogs(): void {
    this.showDeleteDialog.set(false);
    this.showRestoreDialog.set(false);
    this.selectedCustomer.set(null);
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
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
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
   * Track by function for ngFor performance
   */
  trackByCustomerId(index: number, customer: Customer): string {
    return customer.id;
  }
}

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { SidebarConfigService } from '../../shared/services/sidebar-config.service';
import { Product, ProductQueryParameters } from '../../shared/models/product.interface';
import { LucideAngularModule, Search, Plus, Edit, Trash2, Package, AlertTriangle, Eye } from 'lucide-angular';
import { StockAdjustmentModalComponent } from '../stock-adjustment-modal/stock-adjustment-modal.component';
import { debounceTime, Subject, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, StockAdjustmentModalComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
  private sidebarConfigService = inject(SidebarConfigService);

  // Make Math available in template
  readonly Math = Math;

  // Lucide icons
  readonly Search = Search;
  readonly Plus = Plus;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Package = Package;
  readonly AlertTriangle = AlertTriangle;
  readonly Eye = Eye;

  // Signals for reactive state management
  products = signal<Product[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);
  searchTerm = signal('');
  sortBy = signal('name');
  sortDirection = signal<'asc' | 'desc'>('asc');
  statusFilter = signal<'all' | 'active' | 'inactive' | 'lowStock' | 'outOfStock'>('all');
  
  // Keep these for backward compatibility
  lowStockOnly = signal(false);
  includeInactive = signal(false);

  // Stock adjustment modal state
  showStockAdjustmentModal = signal(false);
  selectedProductForAdjustment = signal<Product | null>(null);

  // Computed values
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  hasNextPage = computed(() => this.currentPage() < this.totalPages());
  hasPreviousPage = computed(() => this.currentPage() > 1);

  // Search subject for debouncing
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.setupSearchDebounce();
    this.loadProducts();
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(searchTerm => {
        this.searchTerm.set(searchTerm);
        this.currentPage.set(1);
        return this.performSearch();
      })
    ).subscribe(result => {
      this.products.set(result.items);
      this.totalCount.set(result.totalCount);
      this.loading.set(false);
    });
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  loadProducts() {
    this.performSearch().subscribe(result => {
      this.products.set(result.items);
      this.totalCount.set(result.totalCount);
      this.loading.set(false);
    });
  }

  private performSearch() {
    this.loading.set(true);
    this.error.set(null);

    const params: ProductQueryParameters = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      searchTerm: this.searchTerm() || undefined,
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
      statusFilter: this.statusFilter(),
      // Keep for backward compatibility
      lowStockOnly: this.lowStockOnly() || undefined,
      includeInactive: this.includeInactive() || undefined
    };

    return this.productService.getProducts(params).pipe(
      catchError(error => {
        this.error.set('Failed to load products. Please try again.');
        this.loading.set(false);
        console.error('Error loading products:', error);
        return of({ items: [], totalCount: 0, currentPage: 1, pageSize: 10, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
      })
    );
  }

  onSort(column: string) {
    if (this.sortBy() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
    this.loadProducts();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadProducts();
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(parseInt(target.value));
    this.currentPage.set(1);
    this.loadProducts();
  }

  onToggleLowStockFilter() {
    this.lowStockOnly.set(!this.lowStockOnly());
    this.currentPage.set(1);
    this.loadProducts();
  }

  onLowStockToggle() {
    this.lowStockOnly.set(!this.lowStockOnly());
    this.currentPage.set(1);
    this.loadProducts();
  }

  onToggleIncludeInactive() {
    this.includeInactive.set(!this.includeInactive());
    this.currentPage.set(1);
    this.loadProducts();
  }

  onStatusFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value as 'all' | 'active' | 'inactive' | 'lowStock' | 'outOfStock';
    this.statusFilter.set(value);
    
    // Update legacy signals for backward compatibility
    this.includeInactive.set(value === 'all' || value === 'inactive');
    this.lowStockOnly.set(value === 'lowStock');
    
    this.currentPage.set(1);
    this.loadProducts();
  }

  restoreProduct(product: Product) {
    const confirmMessage = `Are you sure you want to restore "${product.name}"?`;
    
    if (confirm(confirmMessage)) {
      this.loading.set(true);
      this.productService.restoreProduct(product.id).pipe(
        catchError(error => {
          this.error.set('Failed to restore product. Please try again.');
          console.error('Error restoring product:', error);
          return of(null);
        })
      ).subscribe(() => {
        this.loading.set(false);
        this.loadProducts();
      });
    }
  }

  createProduct() {
    this.router.navigate(['/dashboard/inventory/products/new']);
  }

  editProduct(product: Product) {
    this.router.navigate(['/dashboard/inventory/products', product.id, 'edit']);
  }

  deleteProduct(product: Product) {
    const confirmMessage = `Are you sure you want to delete "${product.name}"?`;
      
    if (confirm(confirmMessage)) {
      this.loading.set(true);
      this.productService.deleteProduct(product.id).pipe(
        catchError(error => {
          this.error.set('Failed to delete product. Please try again.');
          console.error('Error deleting product:', error);
          return of(null);
        })
      ).subscribe(() => {
        this.loading.set(false);
        this.loadProducts();
      });
    }
  }

  adjustStock(product: Product) {
    this.selectedProductForAdjustment.set(product);
    this.showStockAdjustmentModal.set(true);
  }

  onStockAdjusted() {
    this.showStockAdjustmentModal.set(false);
    this.selectedProductForAdjustment.set(null);
    // Reload products to reflect the updated stock
    this.loadProducts();
    // Refresh the sidebar low stock count
    this.sidebarConfigService.refreshLowStockCount();
  }

  onStockAdjustmentCancelled() {
    this.showStockAdjustmentModal.set(false);
    this.selectedProductForAdjustment.set(null);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStockStatusClass(product: Product): string {
    if (product.isLowStock) {
      return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
    }
    return product.currentStock > 0 ? 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400' : 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
  }

  getProductStatusText(product: Product): string {
    return product.isDeleted ? 'Inactive' : 'Active';
  }

  viewProduct(product: Product) {
    this.router.navigate(['/dashboard/inventory/products', product.id, 'view']);
  }
}

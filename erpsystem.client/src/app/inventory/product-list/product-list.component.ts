import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { Product, ProductQueryParameters } from '../../shared/models/product.interface';
import { LucideAngularModule, Search, Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-angular';
import { debounceTime, Subject, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);

  // Make Math available in template
  readonly Math = Math;

  // Lucide icons
  readonly Search = Search;
  readonly Plus = Plus;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Package = Package;
  readonly AlertTriangle = AlertTriangle;

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
  lowStockOnly = signal(false);

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
      lowStockOnly: this.lowStockOnly() || undefined
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

  onLowStockToggle() {
    this.lowStockOnly.set(!this.lowStockOnly());
    this.currentPage.set(1);
    this.loadProducts();
  }

  createProduct() {
    this.router.navigate(['/dashboard/inventory/products/new']);
  }

  editProduct(product: Product) {
    this.router.navigate(['/dashboard/inventory/products', product.id, 'edit']);
  }

  deleteProduct(product: Product) {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
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
    // This will be implemented with a modal
    console.log('Adjust stock for:', product.name);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStockStatusClass(product: Product): string {
    if (product.isLowStock) {
      return 'text-red-600 bg-red-100';
    }
    return product.currentStock > 0 ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  }
}

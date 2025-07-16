import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { StockAdjustmentResponse, Product } from '../../shared/models/product.interface';
import { LucideAngularModule, ClipboardList, Search, Filter, Package, Calendar, User, TrendingUp, TrendingDown, RefreshCw } from 'lucide-angular';
import { debounceTime, Subject, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-stock-adjustment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './stock-adjustment-list.component.html',
  styleUrl: './stock-adjustment-list.component.css'
})
export class StockAdjustmentListComponent implements OnInit {
  // Make Math available in template
  readonly Math = Math;
  
  // Lucide icons
  readonly ClipboardList = ClipboardList;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly Package = Package;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly RefreshCw = RefreshCw;

  // Component state signals
  adjustments = signal<StockAdjustmentResponse[]>([]);
  loading = signal(false);
  error = signal<string>('');
  
  // Pagination signals
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  
  // Filter signals
  selectedProductId = signal<string>('');
  searchTerm = signal('');
  
  // Available products for filter dropdown
  availableProducts = signal<Product[]>([]);
  
  // Computed values
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  hasNextPage = computed(() => this.currentPage() < this.totalPages());
  hasPreviousPage = computed(() => this.currentPage() > 1);
  
  // Search subject for debouncing
  private searchSubject = new Subject<string>();

  constructor(
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.setupSearchDebounce();
    this.loadProducts();
    
    // Check for productId query parameter
    this.route.queryParams.subscribe(params => {
      if (params['productId']) {
        this.selectedProductId.set(params['productId']);
      }
      this.loadStockAdjustments();
    });
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(searchTerm => {
        this.searchTerm.set(searchTerm);
        this.currentPage.set(1);
        return of(null);
      })
    ).subscribe(() => {
      this.loadStockAdjustments();
    });
  }

  private loadProducts() {
    // Load products for the filter dropdown
    this.productService.getProducts({
      page: 1,
      pageSize: 1000, // Get all products for dropdown
      searchTerm: '',
      sortBy: 'name',
      sortDirection: 'asc',
      statusFilter: 'active'
    }).subscribe({
      next: (result) => {
        this.availableProducts.set(result.items);
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  loadStockAdjustments() {
    this.loading.set(true);
    this.error.set('');

    const productId = this.selectedProductId() || undefined;
    
    this.productService.getStockAdjustments(productId, this.currentPage(), this.pageSize()).pipe(
      catchError(error => {
        this.error.set('Failed to load stock adjustments. Please try again.');
        console.error('Error loading stock adjustments:', error);
        return of({ items: [], totalCount: 0, currentPage: 1, pageSize: 10 });
      })
    ).subscribe(result => {
      this.adjustments.set(result.items);
      this.totalCount.set(result.totalCount);
      this.loading.set(false);
    });
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onProductFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedProductId.set(target.value);
    this.currentPage.set(1);
    this.loadStockAdjustments();
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(parseInt(target.value));
    this.currentPage.set(1);
    this.loadStockAdjustments();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadStockAdjustments();
  }

  clearFilters() {
    this.selectedProductId.set('');
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadStockAdjustments();
  }

  refreshData() {
    this.loadStockAdjustments();
  }

  viewProduct(productId: string) {
    this.router.navigate(['/dashboard/inventory/products', productId, 'view']);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  getAdjustmentTypeClass(quantity: number): string {
    return quantity > 0 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  }

  getAdjustmentTypeIcon(quantity: number) {
    return quantity > 0 ? this.TrendingUp : this.TrendingDown;
  }

  getAdjustmentTypeText(quantity: number): string {
    return quantity > 0 ? 'Stock Added' : 'Stock Removed';
  }

  getFormattedQuantity(quantity: number): string {
    return quantity > 0 ? `+${quantity}` : quantity.toString();
  }
}

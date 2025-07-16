import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { Product } from '../../shared/models/product.interface';
import { LucideAngularModule, AlertTriangle, Package, TrendingDown, Eye, Edit, ShoppingCart, RefreshCw, Filter, Search } from 'lucide-angular';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-low-stock-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './low-stock-alerts.component.html',
  styleUrl: './low-stock-alerts.component.css'
})
export class LowStockAlertsComponent implements OnInit {
  // Lucide icons
  readonly AlertTriangle = AlertTriangle;
  readonly Package = Package;
  readonly TrendingDown = TrendingDown;
  readonly Eye = Eye;
  readonly Edit = Edit;
  readonly ShoppingCart = ShoppingCart;
  readonly RefreshCw = RefreshCw;
  readonly Filter = Filter;
  readonly Search = Search;

  // Component state signals
  lowStockProducts = signal<Product[]>([]);
  outOfStockProducts = signal<Product[]>([]);
  loading = signal(false);
  error = signal<string>('');
  
  // Filter signals
  searchTerm = signal('');
  currentView = signal<'all' | 'lowStock' | 'outOfStock'>('all');
  
  // Pagination signals
  currentPage = signal(1);
  pageSize = signal(10);
  totalLowStock = signal(0);
  totalOutOfStock = signal(0);

  // Computed values
  filteredProducts = computed(() => {
    const view = this.currentView();
    const search = this.searchTerm().toLowerCase();
    
    let products: Product[] = [];
    
    if (view === 'lowStock') {
      // Only show products that are low stock but NOT out of stock
      products = this.lowStockProducts().filter(p => p.currentStock > 0);
    } else if (view === 'outOfStock') {
      products = this.outOfStockProducts();
    } else {
      // For 'all' view, combine but deduplicate by product ID
      const allProducts = [...this.lowStockProducts(), ...this.outOfStockProducts()];
      const uniqueProductsMap = new Map<string, Product>();
      
      allProducts.forEach(product => {
        if (!uniqueProductsMap.has(product.id)) {
          uniqueProductsMap.set(product.id, product);
        }
      });
      
      products = Array.from(uniqueProductsMap.values());
    }
    
    if (search) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.sku.toLowerCase().includes(search)
      );
    }
    
    return products;
  });

  totalAlerts = computed(() => this.totalLowStock() + this.totalOutOfStock());

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadLowStockAlerts();
  }

  loadLowStockAlerts() {
    this.loading.set(true);
    this.error.set('');

    // Load all products that need attention with a single API call
    this.productService.getProducts({
      page: 1,
      pageSize: 200, // Get more items for alerts
      searchTerm: '',
      sortBy: 'currentstock',
      sortDirection: 'asc',
      lowStockOnly: true // This should include both low stock and out of stock
    }).pipe(
      catchError(error => {
        console.error('Error loading stock alerts:', error);
        return of({ items: [], totalCount: 0, currentPage: 1, pageSize: 200 });
      })
    ).subscribe(result => {
      const allAlertProducts = result.items;
      
      // Separate products into low stock (>0 stock but low) and out of stock (=0 stock)
      const lowStockItems = allAlertProducts.filter(p => p.currentStock > 0 && p.isLowStock);
      const outOfStockItems = allAlertProducts.filter(p => p.currentStock === 0);
      
      this.lowStockProducts.set(lowStockItems);
      this.outOfStockProducts.set(outOfStockItems);
      this.totalLowStock.set(lowStockItems.length);
      this.totalOutOfStock.set(outOfStockItems.length);
      this.loading.set(false);
    });
  }

  private loadOutOfStockProducts() {
    // This method is no longer needed since we load everything in one call
    // Keep it for backward compatibility but make it do nothing
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  setView(view: 'all' | 'lowStock' | 'outOfStock') {
    this.currentView.set(view);
  }

  refreshAlerts() {
    this.loadLowStockAlerts();
  }

  viewProduct(product: Product) {
    this.router.navigate(['/dashboard/inventory/products', product.id, 'view']);
  }

  editProduct(product: Product) {
    this.router.navigate(['/dashboard/inventory/products', product.id, 'edit']);
  }

  createPurchaseOrder(product: Product) {
    // Navigate to purchase order creation with product context
    this.router.navigate(['/dashboard/supply-chain/purchase-orders/new'], {
      queryParams: { productId: product.id }
    });
  }

  getStockStatusClass(product: Product): string {
    if (!product) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    
    if (product.currentStock === 0) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    if (product.isLowStock) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }

  getStockStatusText(product: Product): string {
    if (!product) return 'Unknown';
    
    if (product.currentStock === 0) return 'Out of Stock';
    if (product.isLowStock) return 'Low Stock';
    return 'In Stock';
  }

  getUrgencyLevel(product: Product): 'critical' | 'warning' | 'normal' {
    if (!product) return 'normal';
    
    if (product.currentStock === 0) return 'critical';
    if (product.minimumStock && product.currentStock <= product.minimumStock * 0.5) return 'critical';
    if (product.isLowStock) return 'warning';
    return 'normal';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getRecommendedOrderQuantity(product: Product): number {
    if (!product || !product.minimumStock) return 10; // Default recommendation
    
    // Recommend ordering enough to reach 2x minimum stock
    const targetStock = product.minimumStock * 2;
    const currentDeficit = targetStock - product.currentStock;
    return Math.max(currentDeficit, product.minimumStock);
  }

  getDaysUntilStockOut(product: Product): number | null {
    if (!product) return null;
    
    // This would typically be calculated based on sales velocity
    // For now, return a simple estimate based on current stock
    if (product.currentStock === 0) return 0;
    if (!product.minimumStock) return null;
    
    // Rough estimate: if at minimum stock, assume 7 days left
    const ratio = product.currentStock / product.minimumStock;
    if (ratio <= 0.5) return 3; // 3 days
    if (ratio <= 1) return 7; // 1 week
    return null; // Not critical
  }

  trackByProductId(index: number, product: Product): string {
    return product?.id || index.toString();
  }
}

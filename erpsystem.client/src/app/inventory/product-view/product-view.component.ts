import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { SidebarConfigService } from '../../shared/services/sidebar-config.service';
import { Product, StockAdjustmentResponse } from '../../shared/models/product.interface';
import { LucideAngularModule, Package, Calendar, DollarSign, TrendingUp, TrendingDown, ArrowLeft, Edit, AlertTriangle, CheckCircle, BarChart3, History, Eye, EyeOff } from 'lucide-angular';
import { StockAdjustmentModalComponent } from '../stock-adjustment-modal/stock-adjustment-modal.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, StockAdjustmentModalComponent],
  templateUrl: './product-view.component.html',
  styleUrl: './product-view.component.css'
})
export class ProductViewComponent implements OnInit {
  // Make Date constructor available in template
  readonly Date = Date;
  
  // Lucide icons
  readonly Package = Package;
  readonly Calendar = Calendar;
  readonly DollarSign = DollarSign;
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly ArrowLeft = ArrowLeft;
  readonly Edit = Edit;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle = CheckCircle;
  readonly BarChart3 = BarChart3;
  readonly History = History;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  // Component state signals
  product = signal<Product | null>(null);
  recentAdjustments = signal<StockAdjustmentResponse[]>([]);
  loading = signal(false);
  adjustmentsLoading = signal(false);
  error = signal<string>('');
  productId = signal<string>('');

  // Stock adjustment modal state
  showStockAdjustmentModal = signal(false);
  selectedProductForAdjustment = signal<Product | null>(null);

  // Computed values
  stockStatus = computed(() => {
    const prod = this.product();
    if (!prod) return 'unknown';
    
    if (prod.availableStock === 0) return 'out-of-stock';
    if (prod.isLowStock || (prod.minimumStock && prod.availableStock <= prod.minimumStock)) return 'low-stock';
    return 'available';
  });

  stockStatusClass = computed(() => {
    const status = this.stockStatus();
    switch (status) {
      case 'out-of-stock':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  });

  stockStatusText = computed(() => {
    const status = this.stockStatus();
    switch (status) {
      case 'out-of-stock':
        return 'Out of Stock';
      case 'low-stock':
        return 'Low Stock';
      case 'available':
        return 'Available';
      default:
        return 'Unknown';
    }
  });

  constructor(
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private sidebarConfigService: SidebarConfigService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.productId.set(id);
        this.loadProduct(id);
        this.loadRecentAdjustments(id);
      } else {
        this.error.set('Product ID not provided');
      }
    });
  }

  private loadProduct(id: string) {
    this.loading.set(true);
    this.error.set('');

    this.productService.getProduct(id).pipe(
      catchError(error => {
        this.error.set('Failed to load product details. Please try again.');
        console.error('Error loading product:', error);
        return of(null);
      })
    ).subscribe(product => {
      this.product.set(product);
      this.loading.set(false);
    });
  }

  private loadRecentAdjustments(productId: string) {
    this.adjustmentsLoading.set(true);
    
    this.productService.getStockAdjustments(productId, 1, 5).pipe(
      catchError(error => {
        console.error('Error loading recent adjustments:', error);
        return of({ items: [], totalCount: 0, currentPage: 1, pageSize: 5 });
      })
    ).subscribe(result => {
      this.recentAdjustments.set(result.items);
      this.adjustmentsLoading.set(false);
    });
  }

  goBack() {
    this.router.navigate(['/dashboard/inventory/products']);
  }

  editProduct() {
    this.router.navigate(['/dashboard/inventory/products', this.productId(), 'edit']);
  }

  viewAllAdjustments() {
    this.router.navigate(['/dashboard/inventory/adjustments'], {
      queryParams: { productId: this.productId() }
    });
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getAdjustmentTypeClass(quantity: number): string {
    return quantity > 0 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  }

  getAdjustmentTypeIcon(quantity: number) {
    return quantity > 0 ? this.TrendingUp : this.TrendingDown;
  }

  getFormattedQuantity(quantity: number): string {
    return quantity > 0 ? `+${quantity}` : quantity.toString();
  }

  calculateProfitMargin(): number {
    const prod = this.product();
    if (!prod || prod.costPrice === 0) return 0;
    return ((prod.unitPrice - prod.costPrice) / prod.costPrice) * 100;
  }

  refresh() {
    if (this.productId()) {
      this.loadProduct(this.productId());
      this.loadRecentAdjustments(this.productId());
    }
  }

  getCurrentDate(): Date {
    return new Date();
  }

  adjustStock() {
    const prod = this.product();
    if (prod) {
      this.selectedProductForAdjustment.set(prod);
      this.showStockAdjustmentModal.set(true);
    }
  }

  onStockAdjusted() {
    this.showStockAdjustmentModal.set(false);
    this.selectedProductForAdjustment.set(null);
    // Reload product data to reflect the updated stock
    if (this.productId()) {
      this.loadProduct(this.productId());
      this.loadRecentAdjustments(this.productId());
    }
    // Refresh the sidebar low stock count
    this.sidebarConfigService.refreshLowStockCount();
  }

  onStockAdjustmentCancelled() {
    this.showStockAdjustmentModal.set(false);
    this.selectedProductForAdjustment.set(null);
  }
}

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Package, AlertTriangle, TrendingDown, RefreshCw, Eye, Filter, Calendar, ChevronRight, Plus, Warehouse, ShoppingBag, FileText } from 'lucide-angular';
import { Observable, Subject, interval, combineLatest, of } from 'rxjs';
import { takeUntil, startWith, debounceTime, distinctUntilChanged, switchMap, catchError, share } from 'rxjs/operators';
import { DashboardService } from '../services/dashboard.service';
import { ProductService } from '../../shared/services/product.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg shadow-lg overflow-hidden">
        <div class="px-6 py-8 text-white">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-3xl font-bold">Inventory Management Dashboard</h1>
              <p class="mt-2 text-blue-100">Monitor stock levels, alerts, and inventory operations</p>
              <div class="mt-4 flex items-center space-x-4">
                <div class="flex items-center text-sm">
                  <lucide-angular [img]="icons.Eye" class="w-4 h-4 mr-1"></lucide-angular>
                  Last updated: {{ formatRelativeTime(lastRefresh) }}
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <button (click)="refreshData()" 
                      [disabled]="isLoading"
                      class="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-md p-2 hover:bg-white/20 transition-colors disabled:opacity-50">
                <lucide-angular [img]="icons.RefreshCw" 
                                [class.animate-spin]="isLoading"
                                class="w-4 h-4"></lucide-angular>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <lucide-angular [img]="icons.AlertTriangle" class="w-5 h-5 text-red-600 dark:text-red-400 mr-3"></lucide-angular>
          <p class="text-red-800 dark:text-red-200">{{ error }}</p>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Products -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <lucide-angular [img]="icons.Package" class="w-8 h-8 text-blue-600 dark:text-blue-400"></lucide-angular>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ inventoryMetrics?.totalProducts || 0 }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Low Stock Items -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <lucide-angular [img]="icons.AlertTriangle" class="w-8 h-8 text-orange-600 dark:text-orange-400"></lucide-angular>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock Items</p>
                <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ inventoryMetrics?.lowStockItems || 0 }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Out of Stock -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <lucide-angular [img]="icons.TrendingDown" class="w-8 h-8 text-red-600 dark:text-red-400"></lucide-angular>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock</p>
                <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ inventoryMetrics?.outOfStockItems || 0 }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Inventory Value -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <lucide-angular [img]="icons.Warehouse" class="w-8 h-8 text-green-600 dark:text-green-400"></lucide-angular>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                <p class="text-2xl font-bold text-green-600 dark:text-green-400 currency-display currency-large"
                   [title]="formatFullCurrency(inventoryMetrics?.totalInventoryValue || 0)">
                  {{ formatCurrency(inventoryMetrics?.totalInventoryValue || 0) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions & Low Stock Alerts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Quick Actions -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a routerLink="/dashboard/inventory/products/new" 
                 class="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <lucide-angular [img]="icons.Plus" class="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3"></lucide-angular>
                <div>
                  <p class="font-medium text-blue-900 dark:text-blue-100">Add Product</p>
                  <p class="text-sm text-blue-600 dark:text-blue-400">Create new product</p>
                </div>
              </a>
              
              <a routerLink="/dashboard/inventory/adjustments" 
                 class="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <lucide-angular [img]="icons.FileText" class="w-6 h-6 text-green-600 dark:text-green-400 mr-3"></lucide-angular>
                <div>
                  <p class="font-medium text-green-900 dark:text-green-100">Stock Adjustment</p>
                  <p class="text-sm text-green-600 dark:text-green-400">Adjust stock levels</p>
                </div>
              </a>
              
              <a routerLink="/dashboard/supply-chain/purchase-orders" 
                 class="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <lucide-angular [img]="icons.ShoppingBag" class="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3"></lucide-angular>
                <div>
                  <p class="font-medium text-purple-900 dark:text-purple-100">Purchase Orders</p>
                  <p class="text-sm text-purple-600 dark:text-purple-400">Manage orders</p>
                </div>
              </a>
              
              <a routerLink="/dashboard/inventory/stock-movements" 
                 class="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                <lucide-angular [img]="icons.Package" class="w-6 h-6 text-orange-600 dark:text-orange-400 mr-3"></lucide-angular>
                <div>
                  <p class="font-medium text-orange-900 dark:text-orange-100">Stock Movements</p>
                  <p class="text-sm text-orange-600 dark:text-orange-400">View history</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <!-- Low Stock Alerts -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Low Stock Alerts</h3>
              <a routerLink="/dashboard/inventory/alerts" 
                 class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                View All
              </a>
            </div>
          </div>
          <div class="p-6">
            <div *ngIf="!inventoryMetrics?.lowStockAlerts?.length" class="text-center py-8">
              <lucide-angular [img]="icons.Package" class="w-12 h-12 text-gray-400 mx-auto mb-4"></lucide-angular>
              <p class="text-gray-500 dark:text-gray-400">No low stock alerts</p>
            </div>
            
            <div *ngFor="let alert of inventoryMetrics?.lowStockAlerts?.slice(0, 5)" 
                 class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ alert.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">SKU: {{ alert.sku }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-orange-600 dark:text-orange-400">
                  {{ alert.currentStock }}/{{ alert.minimumStock }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Current/Min</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../dashboard-home/dashboard-home.component.css']
})
export class InventoryDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly dashboardService = inject(DashboardService);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);

  // Icons
  readonly icons = {
    Package,
    AlertTriangle,
    TrendingDown,
    RefreshCw,
    Eye,
    Filter,
    Calendar,
    ChevronRight,
    Plus,
    Warehouse,
    ShoppingBag,
    FileText
  };

  // State management
  isLoading = true;
  error: string | null = null;
  lastRefresh = new Date();

  // Dashboard data
  inventoryMetrics: any = null;

  ngOnInit() {
    this.loadInventoryData();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInventoryData(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getInventoryMetrics()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading inventory data:', error);
          this.error = 'Failed to load inventory data. Please try again.';
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe({
        next: (metrics) => {
          if (metrics) {
            this.inventoryMetrics = metrics;
          }
          this.lastRefresh = new Date();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  private setupAutoRefresh(): void {
    // Auto-refresh every 5 minutes
    interval(5 * 60 * 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshData();
      });
  }

  refreshData(): void {
    this.loadInventoryData();
  }

  // Formatting methods
  formatCurrency(amount: number): string {
    const absAmount = Math.abs(amount);
    
    if (absAmount >= 1000000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(amount / 1000000000) + 'B';
    } else if (absAmount >= 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(amount / 1000000) + 'M';
    } else if (absAmount >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(amount / 1000) + 'K';
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount);
    }
  }

  formatFullCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}

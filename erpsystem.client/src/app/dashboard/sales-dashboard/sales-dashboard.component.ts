import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, ShoppingCart, Users, FileText, DollarSign, RefreshCw, Eye, TrendingUp, Plus, UserPlus, ArrowUp, ArrowDown, Minus, AlertTriangle } from 'lucide-angular';
import { Observable, Subject, interval, combineLatest, of } from 'rxjs';
import { takeUntil, startWith, debounceTime, distinctUntilChanged, switchMap, catchError, share } from 'rxjs/operators';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './sales-dashboard.component.html',
  styleUrls: ['./sales-dashboard.component.css']
})
export class SalesDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);

  // Make Array available in template
  protected readonly Array = Array;

  // Icons
  readonly icons = {
    ShoppingCart,
    Users,
    FileText,
    DollarSign,
    RefreshCw,
    Eye,
    TrendingUp,
    Plus,
    UserPlus,
    ArrowUp,
    ArrowDown,
    Minus,
    AlertTriangle
  };

  // State management
  isLoading = true;
  error: string | null = null;
  lastRefresh = new Date();

  // Dashboard data
  salesMetrics: any = null;
  dashboardStats: any = null;

  // Filters and controls
  dateRangeControl = new FormControl<string>('30');
  dateRangeOptions = [
    { label: 'Today', value: '1', days: 1 },
    { label: 'Last 7 days', value: '7', days: 7 },
    { label: 'Last 30 days', value: '30', days: 30 },
    { label: 'Last 90 days', value: '90', days: 90 },
    { label: 'Last year', value: '365', days: 365 }
  ];

  ngOnInit() {
    this.loadSalesData();
    this.setupAutoRefresh();
    this.setupDateRangeFilter();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSalesData(): void {
    this.isLoading = true;
    this.error = null;

    const dateRange = this.getDateRange();

    combineLatest([
      this.dashboardService.getSalesMetrics(dateRange.from, dateRange.to),
      this.dashboardService.getDashboardStats(dateRange.from, dateRange.to)
    ])
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading sales data:', error);
          this.error = 'Failed to load sales data. Please try again.';
          this.isLoading = false;
          return of([null, null]);
        })
      )
      .subscribe({
        next: ([salesMetrics, dashboardStats]) => {
          if (salesMetrics) {
            this.salesMetrics = salesMetrics;
          }
          if (dashboardStats) {
            this.dashboardStats = dashboardStats;
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

  private setupDateRangeFilter(): void {
    this.dateRangeControl.valueChanges
      .pipe(
        startWith(this.dateRangeControl.value),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadSalesData();
      });
  }

  private getDateRange(): { from: Date; to: Date } {
    const days = parseInt(this.dateRangeControl.value || '30');
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    
    return { from, to };
  }

  refreshData(): void {
    this.loadSalesData();
  }

  // Formatting methods (same as dashboard-home component)
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

  getOrderStatusClass(status: number): string {
    switch (status) {
      case 0: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'; // New
      case 1: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'; // Processing
      case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'; // Shipped
      case 3: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'; // Completed
      case 4: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'; // Cancelled
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getOrderStatusText(status: number): string {
    switch (status) {
      case 0: return 'New';
      case 1: return 'Processing';
      case 2: return 'Shipped';
      case 3: return 'Completed';
      case 4: return 'Cancelled';
      default: return 'Unknown';
    }
  }
}

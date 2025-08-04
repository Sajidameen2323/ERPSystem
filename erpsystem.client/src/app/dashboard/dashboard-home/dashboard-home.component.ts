import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, User, Users, Package, TrendingUp, Settings, ShoppingCart, FileText, BarChart3, AlertTriangle, RefreshCw, Filter, Calendar, DollarSign, Clock, Eye, ChevronRight, ArrowUp, ArrowDown, Minus, UserPlus, Database } from 'lucide-angular';
import { Observable, Subject, interval, combineLatest, of } from 'rxjs';
import { takeUntil, startWith, debounceTime, distinctUntilChanged, switchMap, catchError, share } from 'rxjs/operators';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  DashboardOverview, 
  DashboardStats, 
  RecentActivity, 
  DashboardFilters,
  DateRangeOption,
  LiveMetric,
  LowStockAlert,
  TopCustomer,
  TopProduct,
  RecentOrder
} from '../models/dashboard.model';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css']
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);

  // Icons
  readonly icons = {
    User,
    Users,
    Package,
    TrendingUp,
    Settings,
    ShoppingCart,
    FileText,
    BarChart3,
    AlertTriangle,
    RefreshCw,
    Filter,
    Calendar,
    DollarSign,
    Clock,
    Eye,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    Minus,
    UserPlus,
    Database
  };

  // State management
  isLoading = true;
  error: string | null = null;
  lastRefresh = new Date();

  // Dashboard data
  dashboardOverview: DashboardOverview | null = null;
  dashboardStats: DashboardStats | null = null;

  // Filters and controls
  dateRangeControl = new FormControl<string>('30');
  dateRangeOptions: DateRangeOption[] = [
    { label: 'Today', value: '1', days: 1 },
    { label: 'Last 7 days', value: '7', days: 7 },
    { label: 'Last 30 days', value: '30', days: 30 },
    { label: 'Last 90 days', value: '90', days: 90 },
    { label: 'Last year', value: '365', days: 365 }
  ];

  // Quick actions
  quickActions = [
    {
      title: 'Add Product',
      description: 'Add new product to inventory',
      route: '/dashboard/inventory/products/new',
      icon: this.icons.Package,
      color: 'bg-blue-600 hover:bg-blue-700',
      roles: ['admin', 'inventoryuser']
    },
    {
      title: 'Create Order',
      description: 'Create new sales order',
      route: '/dashboard/sales/orders/new',
      icon: this.icons.ShoppingCart,
      color: 'bg-green-600 hover:bg-green-700',
      roles: ['admin', 'salesuser']
    },
    {
      title: 'Add Customer',
      description: 'Register new customer',
      route: '/dashboard/sales/customers/new',
      icon: this.icons.User,
      color: 'bg-purple-600 hover:bg-purple-700',
      roles: ['admin', 'salesuser']
    },
    {
      title: 'Create Invoice',
      description: 'Generate new invoice',
      route: '/dashboard/sales/invoices/new',
      icon: this.icons.FileText,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      roles: ['admin', 'salesuser']
    },
    {
      title: 'View Reports',
      description: 'Generate business reports',
      route: '/dashboard/reports',
      icon: this.icons.BarChart3,
      color: 'bg-orange-600 hover:bg-orange-700',
      roles: ['admin', 'salesuser', 'inventoryuser']
    },
    {
      title: 'System Settings',
      description: 'Configure system settings',
      route: '/dashboard/admin/settings',
      icon: this.icons.Settings,
      color: 'bg-gray-600 hover:bg-gray-700',
      roles: ['admin']
    }
  ];

  // User roles from auth service
  userRoles: string[] = [];

  ngOnInit() {
    this.initializeComponent();
    this.setupDataRefresh();
    this.setupDateRangeFilter();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent() {
    // Get user roles from auth service
    this.userRoles = this.authService.getUserRoles();
    
    // Initial data load
    this.loadDashboardData();
  }

  private setupDataRefresh() {
    // Auto-refresh every 5 minutes
    interval(5 * 60 * 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshDashboard();
      });
  }

  private setupDateRangeFilter() {
    this.dateRangeControl.valueChanges
      .pipe(
        startWith(this.dateRangeControl.value),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadDashboardData();
      });
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    const dateRange = this.getDateRange();
    
    this.dashboardService.getDashboardOverview(dateRange)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading dashboard data:', error);
          this.error = 'Failed to load dashboard data. Please try again.';
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe({
        next: (overview) => {
          if (overview) {
            console.log('Dashboard Overview:', overview);
            console.log('Recent Activities:', overview.recentActivities);
            this.dashboardOverview = overview;
            this.dashboardStats = overview.stats;
          }
          this.lastRefresh = new Date();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  private getDateRange(): { from: Date; to: Date } {
    const days = parseInt(this.dateRangeControl.value || '30');
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    
    return { from, to };
  }

  // Public methods
  refreshDashboard() {
    this.loadDashboardData();
  }

  hasRole(role: string): boolean {
    return this.userRoles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.userRoles.includes(role));
  }

  // Formatting methods
  formatCurrency(amount: number): string {
    // Handle large numbers with abbreviations to prevent overflow
    const absAmount = Math.abs(amount);
    
    if (absAmount >= 1000000000) {
      // Billions
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(amount / 1000000000) + 'B';
    } else if (absAmount >= 1000000) {
      // Millions
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(amount / 1000000) + 'M';
    } else if (absAmount >= 1000) {
      // Thousands
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(amount / 1000) + 'K';
    } else {
      // Less than 1000, show full amount
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount);
    }
  }

  formatNumber(value: number): string {
    // Handle large numbers with abbreviations
    const absValue = Math.abs(value);
    
    if (absValue >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    } else if (absValue >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (absValue >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    } else {
      return new Intl.NumberFormat('en-US').format(value);
    }
  }

  formatPercent(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  }

  /**
   * Format currency with compact notation for very tight spaces
   */
  formatCompactCurrency(amount: number): string {
    const absAmount = Math.abs(amount);
    
    if (absAmount >= 1000000000) {
      return '$' + (amount / 1000000000).toFixed(1) + 'B';
    } else if (absAmount >= 1000000) {
      return '$' + (amount / 1000000).toFixed(1) + 'M';
    } else if (absAmount >= 1000) {
      return '$' + (amount / 1000).toFixed(1) + 'K';
    } else {
      return '$' + amount.toFixed(0);
    }
  }

  /**
   * Get the full formatted currency value for tooltips
   */
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

  // Icon and color methods
  getStatIcon(statType: string) {
    switch (statType) {
      case 'products': return this.icons.Package;
      case 'orders': return this.icons.ShoppingCart;
      case 'customers': return this.icons.Users;
      case 'revenue': return this.icons.DollarSign;
      case 'invoices': return this.icons.FileText;
      case 'lowstock': return this.icons.AlertTriangle;
      default: return this.icons.BarChart3;
    }
  }

  getStatColor(statType: string): string {
    switch (statType) {
      case 'products': return 'text-blue-600 dark:text-blue-400';
      case 'orders': return 'text-green-600 dark:text-green-400';
      case 'customers': return 'text-purple-600 dark:text-purple-400';
      case 'revenue': return 'text-yellow-600 dark:text-yellow-400';
      case 'invoices': return 'text-red-600 dark:text-red-400';
      case 'lowstock': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  }

  getActivityIcon(activity: RecentActivity) {
    switch (activity.icon) {
      case 'ShoppingCart': return this.icons.ShoppingCart;
      case 'AlertTriangle': return this.icons.AlertTriangle;
      case 'User': return this.icons.User;
      case 'UserPlus': return this.icons.UserPlus;
      case 'FileText': return this.icons.FileText;
      case 'Package': return this.icons.Package;
      case 'DollarSign': return this.icons.DollarSign;
      case 'Database': return this.icons.Database;
      case 'Settings': return this.icons.Settings;
      case 'Trash2': return this.icons.AlertTriangle; // Use AlertTriangle for delete
      case 'Edit': return this.icons.Settings; // Use Settings for edit
      case 'LogIn': return this.icons.User; // Use User for login
      default: return this.icons.BarChart3;
    }
  }

  getActivityIconColor(activity: RecentActivity): string {
    const normalizedSeverity = activity.severity?.toLowerCase() || 'info';
    switch (normalizedSeverity) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
      case 'danger': return 'text-red-600 dark:text-red-400';
      case 'info':
      default: return 'text-blue-600 dark:text-blue-400';
    }
  }

  getSeverityBadgeClass(severity: string): string {
    const normalizedSeverity = severity?.toLowerCase() || 'info';
    switch (normalizedSeverity) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': 
      case 'danger': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'info':
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
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

  getTrendIcon(trend: 'up' | 'down' | 'stable') {
    switch (trend) {
      case 'up': return this.icons.ArrowUp;
      case 'down': return this.icons.ArrowDown;
      default: return this.icons.Minus;
    }
  }

  getTrendColor(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  }

  // Navigation methods
  navigateToEntity(activity: RecentActivity) {
    switch (activity.entityType) {
      case 'order':
        // Navigate to order detail
        break;
      case 'product':
        // Navigate to product detail
        break;
      case 'customer':
        // Navigate to customer detail
        break;
      case 'invoice':
        // Navigate to invoice detail
        break;
    }
  }

  // Utility methods
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}

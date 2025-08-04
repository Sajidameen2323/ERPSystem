import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, ShoppingCart, Users, FileText, DollarSign, Package, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Eye, Plus, ArrowUp, ArrowDown, Warehouse, ShoppingBag } from 'lucide-angular';
import { Observable, Subject, interval, combineLatest, of } from 'rxjs';
import { takeUntil, startWith, debounceTime, distinctUntilChanged, switchMap, catchError, share } from 'rxjs/operators';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-combined-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './combined-dashboard.component.html',
  styleUrl: './combined-dashboard.component.css'
})
export class CombinedDashboardComponent implements OnInit, OnDestroy {
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
    Package,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Eye,
    Plus,
    ArrowUp,
    ArrowDown,
    Warehouse,
    ShoppingBag
  };

  // State management
  isLoading = true;
  error: string | null = null;
  lastRefresh = new Date();

  // Dashboard data
  salesMetrics: any = null;
  inventoryMetrics: any = null;
  dashboardStats: any = null;

  // User roles for template access
  userRoles = signal<string[]>([]);

  // Form controls
  dateRangeControl = new FormControl('30');

  // Auto-refresh settings
  autoRefreshEnabled = true;
  autoRefreshInterval = 30000; // 30 seconds

  ngOnInit() {
    // Initialize user roles
    this.userRoles.set(this.authService.getUserRoles());
    
    this.initializeDashboard();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDashboard(): void {
    // Setup reactive data streams
    const refreshTrigger$ = combineLatest([
      this.dateRangeControl.valueChanges.pipe(
        startWith(this.dateRangeControl.value),
        debounceTime(300),
        distinctUntilChanged()
      )
    ]);

    // Load dashboard data
    refreshTrigger$.pipe(
      switchMap(([dateRange]) => this.loadDashboardData(dateRange || '30')),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.error = null;
        this.lastRefresh = new Date();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Failed to load dashboard data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private loadDashboardData(dateRange: string): Observable<any> {
    this.isLoading = true;
    this.error = null;

    // Calculate date range
    const days = parseInt(dateRange);
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - days);

    // Get user roles to determine what data to load
    const userRoles = this.authService.getUserRoles();
    const observables: Observable<any>[] = [];

    // Always load dashboard stats (role-aware internally)
    observables.push(
      this.dashboardService.getDashboardStats(fromDate, toDate).pipe(
        catchError(error => {
          console.error('Error loading dashboard stats:', error);
          return of(null);
        })
      )
    );

    // Load sales metrics only if user has sales access
    if (this.hasAnyRole(userRoles, ['admin', 'salesuser'])) {
      observables.push(
        this.dashboardService.getSalesMetrics(fromDate, toDate).pipe(
          catchError(error => {
            console.error('Error loading sales metrics:', error);
            return of(null);
          })
        )
      );
    } else {
      observables.push(of(null)); // Add null placeholder
    }

    // Load inventory metrics only if user has inventory access
    if (this.hasAnyRole(userRoles, ['admin', 'inventoryuser'])) {
      observables.push(
        this.dashboardService.getInventoryMetrics().pipe(
          catchError(error => {
            console.error('Error loading inventory metrics:', error);
            return of(null);
          })
        )
      );
    } else {
      observables.push(of(null)); // Add null placeholder
    }

    return combineLatest(observables).pipe(
      share()
    ).pipe(
      switchMap(([dashboardStats, salesMetrics, inventoryMetrics]) => {
        this.dashboardStats = dashboardStats;
        this.salesMetrics = salesMetrics;
        this.inventoryMetrics = inventoryMetrics;
        return of(true);
      })
    );
  }

  // Role checking helper methods (public for template access)
  hasRole(roles: string[], role: string): boolean {
    return roles.includes(role);
  }

  hasAnyRole(roles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some(role => roles.includes(role));
  }

  private setupAutoRefresh(): void {
    if (this.autoRefreshEnabled) {
      interval(this.autoRefreshInterval).pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.refreshData();
      });
    }
  }

  refreshData(): void {
    this.loadDashboardData(this.dateRangeControl.value || '30').subscribe();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  getChangeIcon(change: number): any {
    return change >= 0 ? this.icons.ArrowUp : this.icons.ArrowDown;
  }

  getChangeColor(change: number): string {
    return change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  }
}

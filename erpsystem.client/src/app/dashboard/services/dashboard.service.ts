import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, combineLatest } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SalesOrderService } from '../../sales/services/sales-order.service';
import { InvoiceService } from '../../sales/services/invoice.service';
import { CustomerService } from '../../sales/services/customer.service';
import { ProductService } from '../../shared/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  DashboardOverview, 
  DashboardStats, 
  RecentActivity, 
  SalesMetrics, 
  InventoryMetrics,
  FinancialMetrics,
  SystemMetrics,
  DashboardChartData,
  TopCustomer,
  TopProduct,
  LowStockAlert,
  RecentOrder,
  PendingTask
} from '../models/dashboard.model';
import { SalesOrderStats } from '../../sales/models/sales-order.model';
import { InvoiceStatistics, InvoiceStatus } from '../../sales/models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly salesOrderService = inject(SalesOrderService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  
  private readonly baseUrl = '/api';

  /**
   * Get role-aware dashboard overview
   */
  getDashboardOverview(dateRange?: { from: Date; to: Date }): Observable<DashboardOverview> {
    const fromDate = dateRange?.from;
    const toDate = dateRange?.to;
    const userRoles = this.authService.getUserRoles();

    const observables: Observable<any>[] = [
      this.getRoleAwareDashboardStats(fromDate, toDate, userRoles),
      this.getRecentActivities()
    ];

    // Add role-specific metrics
    if (this.hasAnyRole(userRoles, ['admin', 'salesuser'])) {
      observables.push(this.getSalesMetrics(fromDate, toDate));
      observables.push(this.getFinancialMetrics(fromDate, toDate));
    }

    if (this.hasAnyRole(userRoles, ['admin', 'inventoryuser'])) {
      observables.push(this.getInventoryMetrics());
    }

    if (this.hasRole(userRoles, 'admin')) {
      observables.push(this.getSystemMetrics());
    }

    return combineLatest(observables).pipe(
      map(results => {
        const [stats, activities] = results;
        let salesMetrics, inventoryMetrics, financialMetrics, systemMetrics;
        
        let index = 2;
        if (this.hasAnyRole(userRoles, ['admin', 'salesuser'])) {
          salesMetrics = results[index++];
          financialMetrics = results[index++];
        }
        
        if (this.hasAnyRole(userRoles, ['admin', 'inventoryuser'])) {
          inventoryMetrics = results[index++];
        }
        
        if (this.hasRole(userRoles, 'admin')) {
          systemMetrics = results[index++];
        }

        return {
          stats,
          recentActivities: activities,
          salesMetrics: salesMetrics || this.getEmptySalesMetrics(),
          inventoryMetrics: inventoryMetrics || this.getEmptyInventoryMetrics(),
          financialMetrics: financialMetrics || this.getEmptyFinancialMetrics(),
          systemMetrics: systemMetrics || this.getEmptySystemMetrics(),
          lastUpdated: new Date()
        };
      }),
      catchError(error => {
        console.error('Error loading dashboard overview:', error);
        return of(this.getEmptyDashboardOverview());
      })
    );
  }

  /**
   * Get role-aware dashboard statistics
   */
  getRoleAwareDashboardStats(fromDate?: Date, toDate?: Date, userRoles?: string[]): Observable<DashboardStats> {
    const roles = userRoles || this.authService.getUserRoles();
    const observables: Observable<any>[] = [];
    
    // Always get basic stats that don't require special permissions
    const hasBasicAccess = this.hasAnyRole(roles, ['admin', 'salesuser', 'inventoryuser']);
    
    if (!hasBasicAccess) {
      return of(this.getEmptyDashboardStats());
    }

    // Sales data - requires sales or admin role
    if (this.hasAnyRole(roles, ['admin', 'salesuser'])) {
      observables.push(
        this.salesOrderService.getSalesOrderStats(fromDate, toDate).pipe(
          catchError(() => of(this.getEmptySalesOrderStats()))
        ),
        this.invoiceService.getInvoiceStatistics(
          fromDate?.toISOString(), 
          toDate?.toISOString()
        ).pipe(
          map(response => response.isSuccess ? response.data! : this.getEmptyInvoiceStats()),
          catchError(() => of(this.getEmptyInvoiceStats()))
        ),
        this.getCustomerCount().pipe(
          catchError(() => of(0))
        )
      );
    } else {
      // Add empty observables for sales data
      observables.push(
        of(this.getEmptySalesOrderStats()),
        of(this.getEmptyInvoiceStats()),
        of(0)
      );
    }

    // Inventory data - requires inventory or admin role
    if (this.hasAnyRole(roles, ['admin', 'inventoryuser'])) {
      observables.push(
        this.getProductCount().pipe(
          catchError(() => of(0))
        ),
        this.getLowStockCount().pipe(
          catchError(() => of(0))
        )
      );
    } else {
      // Add empty observables for inventory data
      observables.push(of(0), of(0));
    }

    return combineLatest(observables).pipe(
      map(([salesStats, invoiceStats, customerCount, productCount, lowStockCount]) => ({
        totalProducts: productCount,
        totalCustomers: customerCount,
        totalOrders: salesStats.totalOrders,
        activeOrders: salesStats.newOrders + salesStats.processingOrders,
        completedOrders: salesStats.completedOrders,
        cancelledOrders: salesStats.cancelledOrders,
        shippedOrders: salesStats.shippedOrders,
        onHoldOrders: salesStats.onHoldOrders,
        totalRevenue: salesStats.totalRevenue,
        averageOrderValue: salesStats.averageOrderValue,
        totalInvoices: invoiceStats.totalInvoices,
        paidInvoices: invoiceStats.invoicesByStatus?.[InvoiceStatus.Paid] || 0,
        pendingInvoices: invoiceStats.invoicesByStatus?.[InvoiceStatus.Sent] || 0,
        overdueInvoices: invoiceStats.invoicesByStatus?.[InvoiceStatus.Overdue] || 0,
        totalInvoiceAmount: invoiceStats.totalAmount,
        totalPaidAmount: invoiceStats.totalPaid,
        totalOverdueAmount: invoiceStats.totalOverdue,
        lowStockItems: lowStockCount,
        averagePaymentDays: invoiceStats.averagePaymentTime
      }))
    );
  }

  /**
   * Get dashboard statistics (backward compatibility)
   */
  getDashboardStats(fromDate?: Date, toDate?: Date): Observable<DashboardStats> {
    return this.getRoleAwareDashboardStats(fromDate, toDate);
  }

  /**
   * Get recent activities
   */
  getRecentActivities(limit: number = 10): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.baseUrl}/dashboard/activities`, {
      params: new HttpParams().set('limit', limit.toString())
    }).pipe(
      catchError(() => of(this.getMockRecentActivities()))
    );
  }

  /**
   * Get sales metrics (role-aware)
   */
  getSalesMetrics(fromDate?: Date, toDate?: Date): Observable<SalesMetrics> {
    const userRoles = this.authService.getUserRoles();
    
    // Check if user has sales permissions
    if (!this.hasAnyRole(userRoles, ['admin', 'salesuser'])) {
      return of(this.getEmptySalesMetrics());
    }

    return combineLatest([
      this.salesOrderService.getSalesOrderStats(fromDate, toDate),
      this.getTopCustomers(),
      this.getRecentOrders(),
      this.getSalesChartData(fromDate, toDate)
    ]).pipe(
      map(([stats, topCustomers, recentOrders, chartData]) => ({
        totalSales: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        averageOrderValue: stats.averageOrderValue,
        salesGrowth: 0, // Calculate based on previous period comparison
        topCustomers,
        recentOrders,
        chartData
      })),
      catchError(() => of(this.getEmptySalesMetrics()))
    );
  }

  /**
   * Get inventory metrics (role-aware)
   */
  getInventoryMetrics(): Observable<InventoryMetrics> {
    const userRoles = this.authService.getUserRoles();
    
    // Check if user has inventory permissions
    if (!this.hasAnyRole(userRoles, ['admin', 'inventoryuser'])) {
      return of(this.getEmptyInventoryMetrics());
    }

    return combineLatest([
      this.getProductCount(),
      this.getLowStockAlerts(),
      this.getTopProducts(),
      this.getInventoryValue()
    ]).pipe(
      map(([totalProducts, lowStockAlerts, topProducts, totalValue]) => ({
        totalProducts,
        lowStockItems: lowStockAlerts.length,
        outOfStockItems: lowStockAlerts.filter(item => item.currentStock === 0).length,
        totalInventoryValue: totalValue,
        lowStockAlerts,
        topProducts
      })),
      catchError(() => of(this.getEmptyInventoryMetrics()))
    );
  }

  /**
   * Get financial metrics (role-aware)
   */
  getFinancialMetrics(fromDate?: Date, toDate?: Date): Observable<FinancialMetrics> {
    const userRoles = this.authService.getUserRoles();
    
    // Check if user has financial permissions (sales or admin)
    if (!this.hasAnyRole(userRoles, ['admin', 'salesuser'])) {
      return of(this.getEmptyFinancialMetrics());
    }

    return this.invoiceService.getInvoiceStatistics(
      fromDate?.toISOString(), 
      toDate?.toISOString()
    ).pipe(
      map(response => {
        const stats = response.isSuccess ? response.data! : this.getEmptyInvoiceStats();
        return {
          totalRevenue: stats.totalAmount,
          totalPaid: stats.totalPaid,
          totalOutstanding: stats.totalAmount - stats.totalPaid,
          totalOverdue: stats.totalOverdue,
          averagePaymentDays: stats.averagePaymentTime,
          paymentTrends: [], // TODO: Implement payment trends
          cashFlow: { income: stats.totalPaid, expenses: 0, net: stats.totalPaid }
        };
      }),
      catchError(() => of(this.getEmptyFinancialMetrics()))
    );
  }

  /**
   * Get system metrics (admin only)
   */
  getSystemMetrics(): Observable<SystemMetrics> {
    const userRoles = this.authService.getUserRoles();
    
    // Only admin can access system metrics
    if (!this.hasRole(userRoles, 'admin')) {
      return of(this.getEmptySystemMetrics());
    }

    return this.http.get<SystemMetrics>(`${this.baseUrl}/dashboard/system-metrics`).pipe(
      catchError(() => of(this.getEmptySystemMetrics()))
    );
  }

  /**
   * Get chart data for sales trends
   */
  getSalesChartData(fromDate?: Date, toDate?: Date): Observable<DashboardChartData> {
    const params = new HttpParams()
      .set('fromDate', fromDate?.toISOString() || '')
      .set('toDate', toDate?.toISOString() || '');

    return this.http.get<DashboardChartData>(`${this.baseUrl}/dashboard/sales-chart`, { params }).pipe(
      catchError(() => of({
        labels: [],
        datasets: []
      }))
    );
  }

  /**
   * Get top customers
   */
  private getTopCustomers(limit: number = 5): Observable<TopCustomer[]> {
    return this.http.get<{ isSuccess: boolean; data: TopCustomer[]; message?: string }>(`${this.baseUrl}/dashboard/top-customers`, {
      params: new HttpParams().set('limit', limit.toString())
    }).pipe(
      map(response => response.isSuccess ? response.data || [] : []),
      catchError(error => {
        console.error('Error loading top customers:', error);
        return of([]);
      })
    );
  }

  /**
   * Get recent orders
   */
  private getRecentOrders(limit: number = 5): Observable<RecentOrder[]> {
    return this.salesOrderService.getSalesOrders({ page: 1, pageSize: limit, sortBy: 'orderDate', sortDescending: true }).pipe(
      map(result => result.items.map(order => ({
        id: order.id,
        referenceNumber: order.referenceNumber || '',
        customerName: 'Customer', // TODO: Load customer name
        amount: order.totalAmount,
        status: order.status,
        orderDate: order.orderDate
      }))),
      catchError(() => of([]))
    );
  }

  /**
   * Get top products
   */
  private getTopProducts(limit: number = 5): Observable<TopProduct[]> {
    return this.http.get<{ isSuccess: boolean; data: TopProduct[]; message?: string }>(`${this.baseUrl}/dashboard/top-products`, {
      params: new HttpParams().set('limit', limit.toString())
    }).pipe(
      map(response => response.isSuccess ? response.data || [] : []),
      catchError(error => {
        console.error('Error loading top products:', error);
        return of([]);
      })
    );
  }

  /**
   * Get low stock alerts
   */
  private getLowStockAlerts(): Observable<LowStockAlert[]> {
    return this.productService.getProducts({ 
      page: 1, 
      pageSize: 50, 
      lowStockOnly: true,
      statusFilter: 'lowStock' 
    }).pipe(
      map(result => result.items.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.currentStock,
        minimumStock: product.minimumStock || 0,
        reorderLevel: product.minimumStock || 0
      }))),
      catchError(() => of([]))
    );
  }

  /**
   * Get customer count
   */
  private getCustomerCount(): Observable<number> {
    return this.customerService.getCustomers({ page: 1, pageSize: 1 }).pipe(
      map(result => result.isSuccess ? result.data?.totalCount || 0 : 0),
      catchError(() => of(0))
    );
  }

  /**
   * Get product count
   */
  private getProductCount(): Observable<number> {
    return this.productService.getProducts({ page: 1, pageSize: 1 }).pipe(
      map(result => result.totalCount || 0),
      catchError(() => of(0))
    );
  }

  /**
   * Get low stock count
   */
  private getLowStockCount(): Observable<number> {
    return this.productService.getProducts({ page: 1, pageSize: 1, lowStockOnly: true, statusFilter: 'lowStock' }).pipe(
      map(result => result.totalCount || 0),
      catchError(() => of(0))
    );
  }

  /**
   * Get total inventory value
   */
  private getInventoryValue(): Observable<number> {
    return this.http.get<{ value: number }>(`${this.baseUrl}/dashboard/inventory-value`).pipe(
      map(response => response.value),
      catchError(() => of(0))
    );
  }

  // Helper methods for empty/default data
  private getEmptyDashboardOverview(): DashboardOverview {
    return {
      stats: this.getEmptyDashboardStats(),
      recentActivities: [],
      salesMetrics: {
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        salesGrowth: 0,
        topCustomers: [],
        recentOrders: [],
        chartData: { labels: [], datasets: [] }
      },
      inventoryMetrics: {
        totalProducts: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalInventoryValue: 0,
        lowStockAlerts: [],
        topProducts: []
      },
      financialMetrics: {
        totalRevenue: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        totalOverdue: 0,
        averagePaymentDays: 0,
        paymentTrends: [],
        cashFlow: { income: 0, expenses: 0, net: 0 }
      },
      systemMetrics: {
        activeUsers: 0,
        systemHealth: 'unknown',
        lastBackup: new Date(),
        pendingTasks: [],
        systemAlerts: []
      },
      lastUpdated: new Date()
    };
  }

  private getEmptyDashboardStats(): DashboardStats {
    return {
      totalProducts: 0,
      totalCustomers: 0,
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      shippedOrders: 0,
      onHoldOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalInvoices: 0,
      paidInvoices: 0,
      pendingInvoices: 0,
      overdueInvoices: 0,
      totalInvoiceAmount: 0,
      totalPaidAmount: 0,
      totalOverdueAmount: 0,
      lowStockItems: 0,
      averagePaymentDays: 0
    };
  }

  private getEmptySalesOrderStats(): SalesOrderStats {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      newOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      onHoldOrders: 0,
      averageOrderValue: 0
    };
  }

  private getEmptyInvoiceStats(): InvoiceStatistics {
    return {
      totalInvoices: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalOverdue: 0,
      averagePaymentTime: 0,
      invoicesByStatus: {
        [InvoiceStatus.Draft]: 0,
        [InvoiceStatus.Sent]: 0,
        [InvoiceStatus.Paid]: 0,
        [InvoiceStatus.PartiallyPaid]: 0,
        [InvoiceStatus.Overdue]: 0,
        [InvoiceStatus.Cancelled]: 0,
        [InvoiceStatus.RefundRequested]: 0,
        [InvoiceStatus.Refunded]: 0
      }
    };
  }

  private getMockRecentActivities(): RecentActivity[] {
    return [
      {
        id: '1',
        type: 'order',
        title: 'New order placed',
        description: 'Order #ORD-2025-001 placed by ABC Corp',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        icon: 'ShoppingCart',
        severity: 'info',
        userId: 'system',
        entityId: '1',
        entityType: 'order'
      },
      {
        id: '2',
        type: 'inventory',
        title: 'Low stock alert',
        description: 'Wireless Mouse inventory is running low (5 units)',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        icon: 'AlertTriangle',
        severity: 'warning',
        userId: 'system',
        entityId: '2',
        entityType: 'product'
      }
    ];
  }

  // Role checking helper methods
  private hasRole(roles: string[], role: string): boolean {
    return roles.includes(role);
  }

  private hasAnyRole(roles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some(role => roles.includes(role));
  }

  private hasAllRoles(roles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.every(role => roles.includes(role));
  }

  // Additional empty metric methods
  private getEmptySalesMetrics(): SalesMetrics {
    return {
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      salesGrowth: 0,
      topCustomers: [],
      recentOrders: [],
      chartData: { labels: [], datasets: [] }
    };
  }

  private getEmptyInventoryMetrics(): InventoryMetrics {
    return {
      totalProducts: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalInventoryValue: 0,
      lowStockAlerts: [],
      topProducts: []
    };
  }

  private getEmptyFinancialMetrics(): FinancialMetrics {
    return {
      totalRevenue: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      averagePaymentDays: 0,
      paymentTrends: [],
      cashFlow: { income: 0, expenses: 0, net: 0 }
    };
  }

  private getEmptySystemMetrics(): SystemMetrics {
    return {
      activeUsers: 0,
      systemHealth: 'unknown',
      lastBackup: new Date(),
      pendingTasks: [],
      systemAlerts: []
    };
  }
}

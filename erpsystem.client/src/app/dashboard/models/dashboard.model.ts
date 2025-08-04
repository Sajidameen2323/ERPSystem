import { SalesOrderStatus } from '../../sales/models/sales-order.model';
import { InvoiceStatus } from '../../sales/models/invoice.model';

export interface DashboardOverview {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  salesMetrics: SalesMetrics;
  inventoryMetrics: InventoryMetrics;
  financialMetrics: FinancialMetrics;
  systemMetrics: SystemMetrics;
  lastUpdated: Date;
}

export interface DashboardStats {
  // Product metrics
  totalProducts: number;
  lowStockItems: number;
  
  // Customer metrics
  totalCustomers: number;
  
  // Order metrics
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  shippedOrders: number;
  onHoldOrders: number;
  
  // Financial metrics
  totalRevenue: number;
  averageOrderValue: number;
  
  // Invoice metrics
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalInvoiceAmount: number;
  totalPaidAmount: number;
  totalOverdueAmount: number;
  averagePaymentDays: number;
}

export interface RecentActivity {
  id: string;
  type: string; // Changed from union type to string to match server DTO
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  severity: string; // Changed from union type to string to match server DTO
  userId: string;
  entityId: string;
  entityType: string;
  metadata?: Record<string, any>;
}

export interface SalesMetrics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesGrowth: number; // Percentage growth from previous period
  topCustomers: TopCustomer[];
  recentOrders: RecentOrder[];
  chartData: DashboardChartData;
}

export interface InventoryMetrics {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalInventoryValue: number;
  lowStockAlerts: LowStockAlert[];
  topProducts: TopProduct[];
}

export interface FinancialMetrics {
  // Sales/Revenue metrics
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  averagePaymentDays: number;
  
  // Supply Chain/Purchase metrics  
  totalPurchaseValue: number;
  totalPurchasePaid: number;
  totalPurchaseOutstanding: number;
  totalReturnValue: number;
  
  // Combined metrics
  netCashFlow: number; // Revenue - Purchases
  grossMargin: number; // (Revenue - Purchase Cost) / Revenue * 100
  
  paymentTrends: PaymentTrend[];
  cashFlow: CashFlow;
}

export interface SystemMetrics {
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastBackup: Date;
  pendingTasks: PendingTask[];
  systemAlerts: SystemAlert[];
}

export interface TopCustomer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date;
  avatar?: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  totalSold: number;
  revenue: number;
  currentStock: number;
  image?: string;
}

export interface LowStockAlert {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  criticalLevel?: boolean;
}

export interface RecentOrder {
  id: string;
  referenceNumber: string;
  customerName: string;
  amount: number;
  status: SalesOrderStatus;
  orderDate: Date;
}

export interface PaymentTrend {
  period: string;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
}

export interface CashFlow {
  income: number;
  expenses: number;
  net: number;
}

export interface PendingTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: Date;
  assignedTo: string;
  type: 'order' | 'invoice' | 'inventory' | 'system';
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface DashboardChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

// Configuration interfaces
export interface DashboardConfig {
  refreshInterval: number; // in milliseconds
  dateRangeOptions: DateRangeOption[];
  chartColors: ChartColorPalette;
  notifications: NotificationConfig;
}

export interface DateRangeOption {
  label: string;
  value: string;
  days: number;
}

export interface ChartColorPalette {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  gradients: {
    blue: string[];
    green: string[];
    purple: string[];
    orange: string[];
  };
}

export interface NotificationConfig {
  enabled: boolean;
  lowStockThreshold: number;
  overdueInvoiceThreshold: number;
  systemAlerts: boolean;
}

// Widget configuration
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'table' | 'list' | 'metric';
  size: 'sm' | 'md' | 'lg' | 'xl';
  position: { row: number; col: number };
  config: WidgetConfig;
  visible: boolean;
  refreshable: boolean;
}

export interface WidgetConfig {
  showHeader?: boolean;
  showFooter?: boolean;
  allowExpand?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  customStyles?: Record<string, string>;
  dataSource?: string;
  chartOptions?: any;
}

// Filter and query interfaces
export interface DashboardFilters {
  dateRange: { from: Date; to: Date };
  customerIds?: string[];
  productIds?: string[];
  orderStatuses?: SalesOrderStatus[];
  invoiceStatuses?: InvoiceStatus[];
}

export interface DashboardQuery {
  filters: DashboardFilters;
  metrics: string[];
  groupBy?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Real-time updates
export interface DashboardUpdate {
  type: 'stats' | 'activity' | 'chart' | 'alert';
  data: any;
  timestamp: Date;
}

export interface LiveMetric {
  key: string;
  value: number;
  previousValue: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  lastUpdated: Date;
}

// Export interfaces for external use
export type DashboardMetricType = 'sales' | 'inventory' | 'financial' | 'customer' | 'system';
export type DashboardTimeframe = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
export type DashboardView = 'overview' | 'sales' | 'inventory' | 'financial' | 'analytics';

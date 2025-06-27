export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  totalSalesOrders: number;
  totalRevenue: number;
  totalRevenueThisMonth: number;
  salesChartData: DashboardChartData[];
  inventoryChartData: DashboardChartData[];
  recentActivities: RecentActivity[];
  topProducts: TopProduct[];
  lowStockItems: LowStockProduct[];
}

export interface DashboardChartData {
  label: string;
  value: number;
  color: string;
}

export interface RecentActivity {
  id: string;
  description: string;
  type: string;
  timestamp: Date;
  userName: string;
  icon: string;
  color: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  totalSold: number;
  revenue: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  status: string;
}

export interface DashboardConfig {
  widgets: DashboardWidget[];
  layout: string;
  refreshInterval: number;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: string;
  position: number;
  isVisible: boolean;
  settings: { [key: string]: any };
}

export type WidgetType = 
  | 'stats-cards' 
  | 'line-chart' 
  | 'pie-chart' 
  | 'activity-feed' 
  | 'alert-list' 
  | 'product-list';

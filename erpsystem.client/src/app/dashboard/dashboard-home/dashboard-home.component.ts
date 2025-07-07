import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, User, Users, Package, TrendingUp, Settings, ShoppingCart, FileText, BarChart3, AlertTriangle } from 'lucide-angular';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css']
})
export class DashboardHomeComponent implements OnInit {
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
    AlertTriangle
  };

  // Sample data - replace with actual data from services
  dashboardStats = {
    totalProducts: 156,
    activeOrders: 23,
    lowStockItems: 8,
    totalCustomers: 89,
    monthlyRevenue: 45670,
    pendingInvoices: 12
  };

  recentActivities = [
    {
      id: 1,
      type: 'order',
      title: 'New order placed',
      description: 'Order #ORD-2025-001 placed by ABC Corp',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      icon: this.icons.ShoppingCart,
      iconColor: 'text-blue-600'
    },
    {
      id: 2,
      type: 'inventory',
      title: 'Low stock alert',
      description: 'Wireless Mouse inventory is running low (5 units)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: this.icons.AlertTriangle,
      iconColor: 'text-yellow-600'
    },
    {
      id: 3,
      type: 'customer',
      title: 'New customer registered',
      description: 'XYZ Solutions has registered as a new customer',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      icon: this.icons.User,
      iconColor: 'text-green-600'
    }
  ];

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
      title: 'View Reports',
      description: 'Generate business reports',
      route: '/dashboard/reports',
      icon: this.icons.BarChart3,
      color: 'bg-orange-600 hover:bg-orange-700',
      roles: ['admin', 'salesuser', 'inventoryuser']
    }
  ];

  // Sample user roles - replace with actual user roles from auth service
  userRoles: string[] = ['admin']; // This should come from your auth service

  ngOnInit() {
    // Load dashboard data
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // TODO: Load actual data from services
    console.log('Loading dashboard data...');
  }

  hasRole(role: string): boolean {
    return this.userRoles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.userRoles.includes(role));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

  getStatIcon(statType: string) {
    switch (statType) {
      case 'products': return this.icons.Package;
      case 'orders': return this.icons.ShoppingCart;
      case 'customers': return this.icons.Users;
      case 'revenue': return this.icons.TrendingUp;
      case 'invoices': return this.icons.FileText;
      default: return this.icons.BarChart3;
    }
  }

  getStatColor(statType: string): string {
    switch (statType) {
      case 'products': return 'text-blue-600';
      case 'orders': return 'text-green-600';
      case 'customers': return 'text-purple-600';
      case 'revenue': return 'text-yellow-600';
      case 'invoices': return 'text-red-600';
      case 'lowstock': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  }
}

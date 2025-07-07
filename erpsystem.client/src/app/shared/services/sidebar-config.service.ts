import { Injectable, signal } from '@angular/core';
import { Home, Users, Package, ShoppingCart, FileText, Settings, LogOut } from 'lucide-angular';

export interface NavigationItem {
  label: string;
  icon?: any;
  route?: string;
  children?: NavigationItem[];
  roles?: string[];
  badge?: string;
  isActive?: boolean;
  isExpanded?: boolean;
}

export interface SidebarConfig {
  collapsedWidth: string;
  expandedWidth: string;
  animationDuration: string;
  persistState: boolean;
  autoCollapseOnMobile: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SidebarConfigService {
  private readonly STORAGE_KEY = 'sidebarCollapsed';
  
  // Sidebar state
  isCollapsed = signal(false);
  isMobile = signal(false);
  expandedItems = signal<Set<string>>(new Set());

  // Sidebar configuration
  private config: SidebarConfig = {
    collapsedWidth: 'w-16',
    expandedWidth: 'w-64',
    animationDuration: 'duration-300',
    persistState: true,
    autoCollapseOnMobile: true
  };

  // Navigation items configuration
  private navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      icon: Home,
      route: '/dashboard',
      roles: ['admin', 'salesuser', 'inventoryuser']
    },
    {
      label: 'Inventory',
      icon: Package,
      roles: ['admin', 'inventoryuser'],
      children: [
        { 
          label: 'Products', 
          route: '/dashboard/inventory/products', 
          roles: ['admin', 'inventoryuser'] 
        },
        { 
          label: 'Stock Adjustments', 
          route: '/dashboard/inventory/adjustments', 
          roles: ['admin', 'inventoryuser'] 
        },
        { 
          label: 'Low Stock Alerts', 
          route: '/dashboard/inventory/alerts', 
          roles: ['admin', 'inventoryuser'], 
          badge: '3' 
        }
      ]
    },
    {
      label: 'Sales',
      icon: ShoppingCart,
      roles: ['admin', 'salesuser'],
      children: [
        { 
          label: 'Customers', 
          route: '/dashboard/sales/customers', 
          roles: ['admin', 'salesuser'] 
        },
        { 
          label: 'Sales Orders', 
          route: '/dashboard/sales/orders', 
          roles: ['admin', 'salesuser'] 
        },
        { 
          label: 'Invoices', 
          route: '/dashboard/sales/invoices', 
          roles: ['admin', 'salesuser'] 
        }
      ]
    },
    {
      label: 'Reports',
      icon: FileText,
      roles: ['admin', 'salesuser', 'inventoryuser'],
      children: [
        { 
          label: 'Sales Report', 
          route: '/dashboard/reports/sales', 
          roles: ['admin', 'salesuser'] 
        },
        { 
          label: 'Inventory Report', 
          route: '/dashboard/reports/inventory', 
          roles: ['admin', 'inventoryuser'] 
        },
        { 
          label: 'Customer Report', 
          route: '/dashboard/reports/customers', 
          roles: ['admin', 'salesuser'] 
        }
      ]
    },
    {
      label: 'Administration',
      icon: Settings,
      roles: ['admin'],
      children: [
        { 
          label: 'User Management', 
          route: '/dashboard/admin/users', 
          roles: ['admin'] 
        },
        { 
          label: 'Register User', 
          route: '/dashboard/admin/register', 
          roles: ['admin'] 
        },
        { 
          label: 'System Settings', 
          route: '/dashboard/admin/settings', 
          roles: ['admin'] 
        }
      ]
    }
  ];

  constructor() {
    this.loadSidebarState();
    this.setupResponsiveListener();
  }

  /**
   * Get navigation items filtered by user roles
   */
  getNavigationItems(userRoles: string[] = []): NavigationItem[] {
    return this.navigationItems
      .filter(item => this.hasRequiredRole(item, userRoles))
      .map(item => ({
        ...item,
        children: item.children?.filter(child => this.hasRequiredRole(child, userRoles))
      }));
  }

  /**
   * Get all navigation items (without role filtering)
   */
  getAllNavigationItems(): NavigationItem[] {
    return [...this.navigationItems];
  }

  /**
   * Add new navigation item
   */
  addNavigationItem(item: NavigationItem, position?: number): void {
    if (position !== undefined) {
      this.navigationItems.splice(position, 0, item);
    } else {
      this.navigationItems.push(item);
    }
  }

  /**
   * Remove navigation item by label
   */
  removeNavigationItem(label: string): void {
    const index = this.navigationItems.findIndex(item => item.label === label);
    if (index > -1) {
      this.navigationItems.splice(index, 1);
    }
  }

  /**
   * Update navigation item
   */
  updateNavigationItem(label: string, updates: Partial<NavigationItem>): void {
    const index = this.navigationItems.findIndex(item => item.label === label);
    if (index > -1) {
      this.navigationItems[index] = { ...this.navigationItems[index], ...updates };
    }
  }

  /**
   * Check if user has required role for navigation item
   */
  hasRequiredRole(item: NavigationItem, userRoles: string[]): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some(role => userRoles.includes(role));
  }

  /**
   * Toggle sidebar collapsed state
   */
  toggleCollapsed(): void {
    this.isCollapsed.set(!this.isCollapsed());
    this.saveSidebarState();
  }

  /**
   * Set sidebar collapsed state
   */
  setCollapsed(collapsed: boolean): void {
    this.isCollapsed.set(collapsed);
    this.saveSidebarState();
  }

  /**
   * Toggle expanded state for navigation item
   */
  toggleExpanded(itemLabel: string): void {
    const expanded = this.expandedItems();
    const newExpanded = new Set(expanded);
    
    if (newExpanded.has(itemLabel)) {
      newExpanded.delete(itemLabel);
    } else {
      newExpanded.add(itemLabel);
    }
    
    this.expandedItems.set(newExpanded);
  }

  /**
   * Check if navigation item is expanded
   */
  isExpanded(itemLabel: string): boolean {
    return this.expandedItems().has(itemLabel);
  }

  /**
   * Get sidebar configuration
   */
  getConfig(): SidebarConfig {
    return { ...this.config };
  }

  /**
   * Update sidebar configuration
   */
  updateConfig(newConfig: Partial<SidebarConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get sidebar CSS classes
   */
  getSidebarClasses(): string {
    const base = 'fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out lg:translate-x-0';
    
    if (this.isMobile()) {
      return `${base} ${this.isCollapsed() ? '-translate-x-full' : 'translate-x-0'}`;
    }
    
    return base;
  }

  /**
   * Get main content CSS classes based on sidebar state
   */
  getMainContentClasses(): string {
    const base = 'flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out';
    
    if (!this.isMobile()) {
      return `${base} ${this.isCollapsed() ? 'lg:ml-16' : ''}`;
    }
    
    return base;
  }

  /**
   * Handle mobile state change
   */
  setMobile(isMobile: boolean): void {
    const wasMobile = this.isMobile();
    this.isMobile.set(isMobile);
    
    if (this.config.autoCollapseOnMobile) {
      // Auto-collapse sidebar on mobile, restore on desktop
      if (isMobile && !wasMobile) {
        this.isCollapsed.set(true);
      } else if (!isMobile && wasMobile) {
        // Restore saved state when switching back to desktop
        this.loadSidebarState();
      }
    }
  }

  /**
   * Close sidebar if on mobile
   */
  closeSidebarOnMobile(): void {
    if (this.isMobile()) {
      this.isCollapsed.set(true);
    }
  }

  /**
   * Load sidebar state from localStorage
   */
  private loadSidebarState(): void {
    if (!this.config.persistState) return;
    
    const savedState = localStorage.getItem(this.STORAGE_KEY);
    if (savedState !== null && !this.isMobile()) {
      this.isCollapsed.set(savedState === 'true');
    }
  }

  /**
   * Save sidebar state to localStorage
   */
  private saveSidebarState(): void {
    if (!this.config.persistState) return;
    
    // Only save state for desktop
    if (!this.isMobile()) {
      localStorage.setItem(this.STORAGE_KEY, this.isCollapsed().toString());
    }
  }

  /**
   * Setup responsive listener for mobile detection
   */
  private setupResponsiveListener(): void {
    // Initial check
    this.setMobile(window.innerWidth < 1024);
    
    // Listen for resize events
    const handleResize = () => {
      this.setMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup would be handled by the component using this service
  }

  /**
   * Get icons for navigation items
   */
  getIcons() {
    return {
      Home,
      Users,
      Package,
      ShoppingCart,
      FileText,
      Settings,
      LogOut
    };
  }
}

import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent, UserProfile, Notification } from '../header/header.component';
import { ThemeService } from '../../services/theme.service';
import { SidebarConfigService } from '../../services/sidebar-config.service';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../../core/services';
import { User } from '../../../core/models/user.interface';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  
  authService = inject(AuthService);
  
  // Current user and roles signals
  currentUser = signal<User | null>(null);
  userRoles = signal<string[]>([]);
  
  // Sample user data for header - will be replaced with actual user data
  headerUserProfile: UserProfile = {
    name: 'Loading...',
    email: 'loading@microbiz.com',
    role: 'Loading...',
    avatar: undefined
  };

  // Sample notifications - replace with actual data from notification service
  notifications: Notification[] = [
    {
      id: '1',
      title: 'Low Stock Alert',
      message: 'Product "Wireless Mouse" is running low (5 units remaining)',
      type: 'warning',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false
    },
    {
      id: '2',
      title: 'New Order',
      message: 'Order #ORD-001 has been placed by Customer ABC Corp',
      type: 'info',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false
    },
    {
      id: '3',
      title: 'Payment Received',
      message: 'Payment of $1,250.00 received for Invoice #INV-123',
      type: 'success',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: true
    }
  ];

  // Computed properties using services
  sidebarClass = computed(() => this.sidebarConfig.getSidebarClasses());
  mainContentClass = computed(() => this.sidebarConfig.getMainContentClasses());
  
  // Service getters for template
  get isSidebarCollapsed() { return this.sidebarConfig.isCollapsed; }
  get isMobile() { return this.layoutService.isMobile; }
  get isDarkMode() { return this.themeService.isDarkMode; }

  constructor(
    public themeService: ThemeService,
    public sidebarConfig: SidebarConfigService,
    public layoutService: LayoutService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Load current user profile and roles from route data
    const user = this.route.snapshot.data['currentUser'];
    if (user) {
      this.currentUser.set(user);
      this.userRoles.set(user.roles || []);
      this.headerUserProfile = {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: this.getUserRoleDisplay(user.roles || []),
        avatar: undefined
      };
    } else {
      this.userRoles.set([]);
      this.setFallbackUserProfile();
    }
  }

  ngOnDestroy() {
    this.layoutService.cleanup();
  }

  /**
   * Set fallback user profile when auth service fails
   */
  private setFallbackUserProfile(): void {
    this.headerUserProfile = {
      name: 'Guest User',
      email: 'guest@microbiz.com',
      role: 'Guest',
      avatar: undefined
    };
  }

  /**
   * Get display-friendly role name for header
   */
  private getUserRoleDisplay(roles: string[]): string {
    if (!roles || roles.length === 0) return 'User';
    
    // Priority order for role display
    const roleDisplayMap: { [key: string]: string } = {
      'admin': 'Administrator',
      'salesuser': 'Sales User',
      'inventoryuser': 'Inventory User',
      'user': 'User'
    };

    // Find the highest priority role
    for (const role of ['admin', 'salesuser', 'inventoryuser', 'user']) {
      if (roles.includes(role)) {
        return roleDisplayMap[role];
      }
    }

    // If no known role, return the first role or 'User'
    return roles[0] || 'User';
  }

  toggleSidebar() {
    this.sidebarConfig.toggleCollapsed();
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  handleLogout() {
    // Implement logout logic here
    console.log('Logging out...');
    this.authService.signOut();
    
  }

  closeSidebarOnMobile() {
    this.sidebarConfig.closeSidebarOnMobile();
  }
}

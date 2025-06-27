import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Settings, RefreshCw, Eye, EyeOff, Menu, X, Users } from 'lucide-angular';
import { Subject, takeUntil, interval, startWith, switchMap } from 'rxjs';

import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DashboardStats, DashboardConfig, DashboardWidget } from '../../../core/models';

import { StatsCardsComponent } from '../widgets/stats-cards/stats-cards.component';
import { ChartComponent } from '../widgets/chart/chart.component';
import { ActivityFeedComponent } from '../widgets/activity-feed/activity-feed.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    LucideAngularModule,
    StatsCardsComponent,
    ChartComponent,
    ActivityFeedComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  stats: DashboardStats | null = null;
  config: DashboardConfig | null = null;
  loading = true;
  error: string | null = null;
  
  isConfigMode = false;
  isSidebarOpen = false;
  
  // Lucide icons
  readonly dashboardIcon = LayoutDashboard;
  readonly settingsIcon = Settings;
  readonly refreshIcon = RefreshCw;
  readonly eyeIcon = Eye;
  readonly eyeOffIcon = EyeOff;
  readonly menuIcon = Menu;
  readonly xIcon = X;
  readonly usersIcon = Users;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load dashboard statistics';
          this.loading = false;
          this.toastService.error('Error', 'Failed to load dashboard data');
        }
      });

    this.dashboardService.getDashboardConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.config = config;
        },
        error: (error) => {
          console.error('Failed to load dashboard config:', error);
        }
      });
  }

  private startAutoRefresh(): void {
    if (this.config?.refreshInterval) {
      interval(this.config.refreshInterval * 1000)
        .pipe(
          startWith(0),
          switchMap(() => this.dashboardService.getDashboardStats()),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (stats) => {
            this.stats = stats;
          },
          error: (error) => {
            console.error('Auto-refresh failed:', error);
          }
        });
    }
  }

  refreshDashboard(): void {
    this.loadDashboardData();
    this.toastService.success('Refreshed', 'Dashboard data has been updated');
  }

  toggleConfigMode(): void {
    this.isConfigMode = !this.isConfigMode;
    if (!this.isConfigMode) {
      this.saveConfiguration();
    }
  }

  closeConfigSidebar(): void {
    this.isConfigMode = false;
    this.saveConfiguration();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  navigateToUserManagement(): void {
    this.router.navigate(['/users']);
  }

  toggleWidget(widget: DashboardWidget): void {
    if (this.config) {
      widget.isVisible = !widget.isVisible;
    }
  }

  private saveConfiguration(): void {
    if (this.config) {
      this.dashboardService.updateDashboardConfig(this.config)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedConfig) => {
            this.config = updatedConfig;
            this.toastService.success('Saved', 'Dashboard configuration updated');
          },
          error: (error) => {
            this.toastService.error('Error', 'Failed to save configuration');
          }
        });
    }
  }

  getVisibleWidgets(): DashboardWidget[] {
    if (!this.config) return [];
    return this.config.widgets
      .filter(w => w.isVisible)
      .sort((a, b) => a.position - b.position);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Home, Users, Package, ShoppingCart, FileText, Settings, LogOut } from 'lucide-angular';
import { SidebarConfigService, NavigationItem } from '../../services/sidebar-config.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnChanges {
  @Input() isCollapsed: any;
  @Input() userRoles: string[] = [];
  @Input() isDarkMode: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  // Icons
  readonly HomeIcon = Home;
  readonly UsersIcon = Users;
  readonly PackageIcon = Package;
  readonly ShoppingCartIcon = ShoppingCart;
  readonly FileTextIcon = FileText;
  readonly SettingsIcon = Settings;
  readonly LogOutIcon = LogOut;

  navigationItems: NavigationItem[] = [];

  constructor(
    private sidebarConfigService: SidebarConfigService,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    this.updateNavigationItems();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userRoles']) {
      this.updateNavigationItems();
    }
  }

  private updateNavigationItems() {
    this.navigationItems = this.sidebarConfigService.getNavigationItems(this.userRoles);
  }

  hasRequiredRole(item: NavigationItem): boolean {
    return this.sidebarConfigService.hasRequiredRole(item, this.userRoles);
  }

  toggleExpanded(itemLabel: string): void {
    this.sidebarConfigService.toggleExpanded(itemLabel);
  }

  isExpanded(itemLabel: string): boolean {
    return this.sidebarConfigService.isExpanded(itemLabel);
  }

  getBadgeValue(item: NavigationItem): string | undefined {
    return this.sidebarConfigService.getBadgeValue(item.badge);
  }
}

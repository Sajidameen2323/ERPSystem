import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Menu, Search, Bell, User, ChevronDown, Settings, LogOut, Moon, Sun } from 'lucide-angular';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Input() user: UserProfile | null = null;
  @Input() notifications: Notification[] = [];
  @Input() isDarkMode: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleDarkMode = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  // Icons
  readonly MenuIcon = Menu;
  readonly SearchIcon = Search;
  readonly BellIcon = Bell;
  readonly UserIcon = User;
  readonly ChevronDownIcon = ChevronDown;
  readonly SettingsIcon = Settings;
  readonly LogOutIcon = LogOut;
  readonly MoonIcon = Moon;
  readonly SunIcon = Sun;

  // State
  showUserDropdown = signal(false);
  showNotifications = signal(false);
  searchQuery = signal('');

  ngOnInit() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.showUserDropdown.set(false);
      this.showNotifications.set(false);
    }
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }

  toggleUserDropdown(): void {
    this.showUserDropdown.set(!this.showUserDropdown());
    this.showNotifications.set(false);
  }

  toggleNotifications(): void {
    this.showNotifications.set(!this.showNotifications());
    this.showUserDropdown.set(false);
  }

  onToggleDarkMode(): void {
    this.toggleDarkMode.emit();
  }

  get unreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'error': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'warning': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'success': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  }

  onSearch(): void {
    // Implement search functionality
    console.log('Searching for:', this.searchQuery());
  }

  getUserInitials(): string {
    if (!this.user?.name) return 'U';
    return this.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }
}

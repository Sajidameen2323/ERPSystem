import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Clock, User, Database, ShoppingCart, Package, Users } from 'lucide-angular';
import { RecentActivity } from '../../../../core/models';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './activity-feed.component.html',
  styleUrl: './activity-feed.component.css'
})
export class ActivityFeedComponent {
  @Input() activities: RecentActivity[] = [];

  // Lucide icons
  readonly clockIcon = Clock;
  readonly userIcon = User;
  readonly databaseIcon = Database;
  readonly shoppingCartIcon = ShoppingCart;
  readonly packageIcon = Package;
  readonly usersIcon = Users;

  getIcon(iconName: string) {
    const iconMap: { [key: string]: any } = {
      'user-plus': this.usersIcon,
      'database': this.databaseIcon,
      'shopping-cart': this.shoppingCartIcon,
      'package': this.packageIcon,
      'user': this.userIcon
    };
    return iconMap[iconName] || this.clockIcon;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }
}

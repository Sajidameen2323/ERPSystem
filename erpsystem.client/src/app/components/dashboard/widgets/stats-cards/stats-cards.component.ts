import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Users, Package, ShoppingCart, TrendingUp, AlertTriangle, UserCheck } from 'lucide-angular';
import { DashboardStats } from '../../../../core/models';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './stats-cards.component.html',
  styleUrl: './stats-cards.component.css'
})
export class StatsCardsComponent {
  @Input() stats: DashboardStats | null = null;

  // Lucide icons
  readonly usersIcon = Users;
  readonly packageIcon = Package;
  readonly shoppingCartIcon = ShoppingCart;
  readonly trendingUpIcon = TrendingUp;
  readonly alertTriangleIcon = AlertTriangle;
  readonly userCheckIcon = UserCheck;
}

import { Component, EventEmitter, Input, Output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  X, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  User, 
  Hash, 
  FileSearch,
  ArrowUpRight,
  ArrowDownLeft,
  Package2,
  Minus
} from 'lucide-angular';

import { StockMovement } from '../../models/purchase-order.interface';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-stock-movement-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './stock-movement-modal.component.html',
  styleUrl: './stock-movement-modal.component.css'
})
export class StockMovementModalComponent {
  // Injected services
  public themeService = inject(ThemeService);

  // Input/Output properties
  @Input() isVisible = false;
  @Input() movement: StockMovement | null = null;
  @Output() close = new EventEmitter<void>();

  // Theme classes computed signal
  themeClasses = computed(() => this.themeService.getClasses());

  // Icons
  readonly XIcon = X;
  readonly PackageIcon = Package;
  readonly Package2Icon = Package2;
  readonly TrendingUpIcon = TrendingUp;
  readonly TrendingDownIcon = TrendingDown;
  readonly ClockIcon = Clock;
  readonly UserIcon = User;
  readonly HashIcon = Hash;
  readonly FileSearchIcon = FileSearch;
  readonly ArrowUpRightIcon = ArrowUpRight;
  readonly ArrowDownLeftIcon = ArrowDownLeft;
  readonly MinusIcon = Minus;

  /**
   * Handle backdrop click to close modal
   */
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  /**
   * Close the modal
   */
  closeModal(): void {
    this.close.emit();
  }

  /**
   * Handle escape key press
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  /**
   * Get movement type badge classes
   */
  getMovementTypeClass(movementType: string): string {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
    
    switch (movementType?.toLowerCase()) {
      case 'purchase':
      case 'received':
      case 'stockin':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300`;
      case 'sale':
      case 'sold':
      case 'stockout':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300`;
      case 'adjustment':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300`;
      case 'damage':
      case 'damaged':
      case 'expired':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300`;
      case 'return':
      case 'returned':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300`;
      case 'transfer':
        return `${baseClasses} bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300`;
    }
  }

  /**
   * Get movement type icon
   */
  getMovementTypeIcon(movementType: string) {
    switch (movementType?.toLowerCase()) {
      case 'purchase':
      case 'received':
      case 'stockin':
        return this.ArrowUpRightIcon;
      case 'sale':
      case 'sold':
      case 'stockout':
        return this.ArrowDownLeftIcon;
      case 'adjustment':
        return this.MinusIcon;
      case 'damage':
      case 'damaged':
      case 'expired':
        return this.TrendingDownIcon;
      case 'return':
      case 'returned':
        return this.ArrowUpRightIcon;
      case 'transfer':
        return this.ArrowUpRightIcon;
      default:
        return this.Package2Icon;
    }
  }

  /**
   * Check if movement decreases stock
   */
  isStockDecrease(movementType: string): boolean {
    return ['sale', 'sold', 'damage', 'damaged', 'stockout', 'expired'].includes(movementType?.toLowerCase());
  }
}

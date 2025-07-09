import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Trash2, UserCheck, UserX, Edit, Download } from 'lucide-angular';

export interface BulkAction {
  id: string;
  label: string;
  icon: any;
  variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  disabled?: boolean;
}

@Component({
  selector: 'app-bulk-actions',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './bulk-actions.component.html',
  styleUrl: './bulk-actions.component.css'
})
export class BulkActionsComponent {
  @Input() selectedCount: number = 0;
  @Input() actions: BulkAction[] = [];
  @Input() customActions: BulkAction[] = [];
  @Output() actionClicked = new EventEmitter<string>();
  @Output() clearSelection = new EventEmitter<void>();

  readonly defaultIcons = {
    Trash2,
    UserCheck,
    UserX,
    Edit,
    Download
  };

  // Default actions for user management
  get defaultActions(): BulkAction[] {
    return [
      {
        id: 'activate',
        label: 'Activate Users',
        icon: this.defaultIcons.UserCheck,
        variant: 'success'
      },
      {
        id: 'deactivate',
        label: 'Deactivate Users',
        icon: this.defaultIcons.UserX,
        variant: 'warning'
      },
      {
        id: 'export',
        label: 'Export Selected',
        icon: this.defaultIcons.Download,
        variant: 'secondary'
      },
      {
        id: 'delete',
        label: 'Delete Users',
        icon: this.defaultIcons.Trash2,
        variant: 'danger'
      }
    ];
  }

  get allActions(): BulkAction[] {
    return [...(this.actions.length > 0 ? this.actions : this.defaultActions), ...this.customActions];
  }

  onActionClick(actionId: string) {
    this.actionClicked.emit(actionId);
  }

  onClearSelection() {
    this.clearSelection.emit();
  }

  getButtonClasses(action: BulkAction): string {
    const baseClasses = 'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    switch (action.variant) {
      case 'primary':
        return `${baseClasses} text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`;
      case 'success':
        return `${baseClasses} text-white bg-green-600 hover:bg-green-700 focus:ring-green-500`;
      case 'warning':
        return `${baseClasses} text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500`;
      case 'danger':
        return `${baseClasses} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;
      case 'secondary':
      default:
        return `${baseClasses} text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-blue-500`;
    }
  }
}

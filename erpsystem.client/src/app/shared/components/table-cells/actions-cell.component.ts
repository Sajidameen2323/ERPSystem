import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Edit, UserX, UserCheck } from 'lucide-angular';
import { User } from '../../../core/models/user.interface';

@Component({
  selector: 'app-actions-cell',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex items-center space-x-2">
      <!-- Edit Button -->
      <button
        type="button"
        (click)="onEdit($event)"
        class="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        title="Edit User">
        <lucide-angular [img]="editIcon" class="w-4 h-4"></lucide-angular>
      </button>

      <!-- Activate/Deactivate Button -->
      <button
        type="button"
        (click)="onToggleStatus($event)"
        [class]="getToggleButtonClasses()"
        [title]="user.isActive ? 'Deactivate User' : 'Activate User'">
        <lucide-angular 
          [img]="user.isActive ? userXIcon : userCheckIcon" 
          class="w-4 h-4">
        </lucide-angular>
      </button>
    </div>
  `,
  styles: []
})
export class ActionsCellComponent {
  @Input() user!: User;
  @Output() edit = new EventEmitter<User>();
  @Output() toggleStatus = new EventEmitter<User>();

  readonly editIcon = Edit;
  readonly userXIcon = UserX;
  readonly userCheckIcon = UserCheck;

  onEdit(event: Event) {
    event.stopPropagation();
    this.edit.emit(this.user);
  }

  onToggleStatus(event: Event) {
    event.stopPropagation();
    this.toggleStatus.emit(this.user);
  }

  getToggleButtonClasses(): string {
    const baseClasses = 'p-1 rounded-md transition-colors';
    
    if (this.user.isActive) {
      return `${baseClasses} text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20`;
    } else {
      return `${baseClasses} text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20`;
    }
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, User as UserIcon } from 'lucide-angular';
import { User } from '../../../core/models/user.interface';

@Component({
  selector: 'app-user-info-cell',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex items-center space-x-3">
      <!-- Avatar -->
      <div class="flex-shrink-0 h-10 w-10">
        <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
          <lucide-angular [img]="userIcon" class="h-5 w-5 text-gray-500 dark:text-gray-400"></lucide-angular>
        </div>
      </div>
      
      <!-- User Info -->
      <div class="flex flex-col">
        <div class="text-sm font-medium text-gray-900 dark:text-white">
          {{ user.displayName || (user.firstName + ' ' + user.lastName) }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ user.email }}
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UserInfoCellComponent {
  @Input() user!: User;
  
  readonly userIcon = UserIcon;
}

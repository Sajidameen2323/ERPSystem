import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-roles-cell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-wrap gap-1">
      <span 
        *ngFor="let role of roles" 
        class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
        {{ role }}
      </span>
      <span 
        *ngIf="!roles || roles.length === 0" 
        class="text-sm text-gray-500 dark:text-gray-400 italic">
        No roles assigned
      </span>
    </div>
  `,
  styles: []
})
export class RolesCellComponent {
  @Input() roles: string[] | null | undefined = [];
}

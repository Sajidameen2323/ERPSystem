import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle, XCircle } from 'lucide-angular';

@Component({
  selector: 'app-status-cell',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex items-center">
      <span [class]="getStatusClasses()">
        <lucide-angular 
          [img]="isActive ? checkIcon : xIcon" 
          class="w-4 h-4 mr-1">
        </lucide-angular>
        {{ getStatusText() }}
      </span>
    </div>
  `,
  styles: []
})
export class StatusCellComponent {
  @Input() isActive!: boolean;
  @Input() status!: string;
  
  readonly checkIcon = CheckCircle;
  readonly xIcon = XCircle;

  getStatusText(): string {
    return this.isActive ? 'Active' : 'Inactive';
  }

  getStatusClasses(): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    if (this.isActive) {
      return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
    } else {
      return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
    }
  }
}

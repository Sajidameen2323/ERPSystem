import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-date-cell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="text-sm">
      <div class="text-gray-900 dark:text-white">
        {{ formatDate(date) }}
      </div>
      <div class="text-gray-500 dark:text-gray-400 text-xs">
        {{ formatTime(date) }}
      </div>
    </div>
  `,
  styles: []
})
export class DateCellComponent {
  @Input() date!: string | Date | null | undefined;

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  formatTime(date: string | Date | null | undefined): string {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }
}

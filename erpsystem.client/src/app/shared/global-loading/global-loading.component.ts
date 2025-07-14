import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalLoadingService } from '../../core/services/global-loading.service';

@Component({
  selector: 'app-global-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="globalLoadingService.isLoading()" 
         class="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-[9999]">
      
      <!-- Loading Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-sm mx-4">
        <div class="flex flex-col items-center space-y-4">
          <!-- Spinner -->
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"></div>
          
          <!-- Loading Message -->
          <div class="text-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {{ globalLoadingService.loadingMessage() }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Please wait while we load your data...
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class GlobalLoadingComponent {
  readonly globalLoadingService = inject(GlobalLoadingService);
}

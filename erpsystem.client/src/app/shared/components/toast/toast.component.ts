import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-angular';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div *ngFor="let toast of toasts; trackBy: trackByToastId"
           class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto overflow-hidden transition-all duration-300 ease-in-out transform"
           [ngClass]="getToastClasses(toast.type)"
           [@slideIn]>
        
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <lucide-angular [img]="getIcon(toast.type)" 
                              [ngClass]="getIconClasses(toast.type)"
                              class="w-5 h-5"></lucide-angular>
            </div>
            
            <div class="ml-3 w-0 flex-1">
              <p class="text-sm font-medium" [ngClass]="getTitleClasses(toast.type)">
                {{ toast.title }}
              </p>
              <p *ngIf="toast.message" class="mt-1 text-sm" [ngClass]="getMessageClasses(toast.type)">
                {{ toast.message }}
              </p>
            </div>
            
            <div class="ml-4 flex-shrink-0 flex">
              <button 
                (click)="removeToast(toast.id)"
                class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                <span class="sr-only">Close</span>
                <lucide-angular [img]="XIcon" class="w-5 h-5"></lucide-angular>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Progress bar for timed toasts -->
        <div *ngIf="!toast.persistent && toast.duration" 
             class="h-1 bg-gray-200">
          <div class="h-1 transition-all ease-linear"
               [ngClass]="getProgressBarClasses(toast.type)"
               [style.animation-duration.ms]="toast.duration">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    @keyframes progress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }
    
    .progress-bar {
      animation: progress linear forwards;
    }
  `],
  animations: []
})
export class ToastComponent {
  @Input() toasts: Toast[] = [];
  @Output() toastRemoved = new EventEmitter<string>();

  readonly XIcon = X;
  readonly CheckCircleIcon = CheckCircle;
  readonly AlertCircleIcon = AlertCircle;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly InfoIcon = Info;

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }

  removeToast(toastId: string) {
    this.toastRemoved.emit(toastId);
  }

  getIcon(type: ToastType) {
    switch (type) {
      case 'success': return this.CheckCircleIcon;
      case 'error': return this.AlertCircleIcon;
      case 'warning': return this.AlertTriangleIcon;
      case 'info': return this.InfoIcon;
      default: return this.InfoIcon;
    }
  }

  getToastClasses(type: ToastType): string {
    const baseClasses = 'border-l-4';
    switch (type) {
      case 'success': return `${baseClasses} border-green-400 bg-green-50`;
      case 'error': return `${baseClasses} border-red-400 bg-red-50`;
      case 'warning': return `${baseClasses} border-yellow-400 bg-yellow-50`;
      case 'info': return `${baseClasses} border-blue-400 bg-blue-50`;
      default: return `${baseClasses} border-gray-400 bg-gray-50`;
    }
  }

  getIconClasses(type: ToastType): string {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  }

  getTitleClasses(type: ToastType): string {
    switch (type) {
      case 'success': return 'text-green-800';
      case 'error': return 'text-red-800';
      case 'warning': return 'text-yellow-800';
      case 'info': return 'text-blue-800';
      default: return 'text-gray-800';
    }
  }

  getMessageClasses(type: ToastType): string {
    switch (type) {
      case 'success': return 'text-green-700';
      case 'error': return 'text-red-700';
      case 'warning': return 'text-yellow-700';
      case 'info': return 'text-blue-700';
      default: return 'text-gray-700';
    }
  }

  getProgressBarClasses(type: ToastType): string {
    const baseClasses = 'progress-bar';
    switch (type) {
      case 'success': return `${baseClasses} bg-green-500`;
      case 'error': return `${baseClasses} bg-red-500`;
      case 'warning': return `${baseClasses} bg-yellow-500`;
      case 'info': return `${baseClasses} bg-blue-500`;
      default: return `${baseClasses} bg-gray-500`;
    }
  }
}

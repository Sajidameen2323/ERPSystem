import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  styleUrls: ['./toast.component.css'],
  template: `
    <div class="fixed top-6 right-6 z-[9999] space-y-3 max-w-md w-full">
      <div
        *ngFor="let toast of toasts; trackBy: trackByToastId"
        class="toast-container relative transform transition-all duration-500 ease-out"
        [class]="getToastContainerClasses(toast.type)"
      >
        <!-- Progress bar -->
        <div 
          class="progress-bar absolute top-0 left-0 h-1 rounded-t-lg transition-all duration-[5000ms] ease-linear"
          [class]="getProgressBarClasses(toast.type)">
        </div>
        
        <div class="relative overflow-hidden rounded-lg toast-backdrop border border-white/20" [class]="getToastShadowClasses(toast.type)">
          <div [class]="getToastClasses(toast.type)">
            <div class="p-4">
              <div class="flex items-start space-x-3">
                <!-- Icon with animated background -->
                <div class="flex-shrink-0 relative">
                  <div class="toast-icon" [class]="getIconBackgroundClasses(toast.type)">
                    <lucide-icon 
                      [img]="getToastIcon(toast.type)" 
                      class="h-5 w-5 relative z-10"
                      [class]="getIconClasses(toast.type)">
                    </lucide-icon>
                  </div>
                </div>
                
                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold leading-5" [class]="getTitleClasses(toast.type)">
                    {{ toast.title }}
                  </p>
                  <p *ngIf="toast.message" class="mt-1 text-sm leading-4 opacity-90" [class]="getMessageClasses(toast.type)">
                    {{ toast.message }}
                  </p>
                </div>
                
                <!-- Close button -->
                <div class="flex-shrink-0">
                  <button
                    type="button"
                    class="inline-flex rounded-full p-1.5 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/20"
                    [class]="getCloseButtonClasses(toast.type)"
                    (click)="removeToast(toast.id)"
                  >
                    <span class="sr-only">Close</span>
                    <lucide-icon [img]="xIcon" class="h-4 w-4"></lucide-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription: Subscription = new Subscription();

  // Lucide icons
  readonly xIcon = X;
  readonly checkCircleIcon = CheckCircle;
  readonly alertCircleIcon = AlertCircle;
  readonly alertTriangleIcon = AlertTriangle;
  readonly infoIcon = Info;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }

  getToastIcon(type: Toast['type']) {
    switch (type) {
      case 'success': return this.checkCircleIcon;
      case 'error': return this.alertCircleIcon;
      case 'warning': return this.alertTriangleIcon;
      case 'info': return this.infoIcon;
      default: return this.infoIcon;
    }
  }

  getToastContainerClasses(type: Toast['type']): string {
    return 'pointer-events-auto';
  }

  getToastShadowClasses(type: Toast['type']): string {
    switch (type) {
      case 'success': return 'toast-success';
      case 'error': return 'toast-error';
      case 'warning': return 'toast-warning';
      case 'info': return 'toast-info';
      default: return 'toast-shadow';
    }
  }

  getProgressBarClasses(type: Toast['type']): string {
    switch (type) {
      case 'success': return 'bg-green-400/80';
      case 'error': return 'bg-red-400/80';
      case 'warning': return 'bg-yellow-400/80';
      case 'info': return 'bg-blue-400/80';
      default: return 'bg-gray-400/80';
    }
  }

  getToastClasses(type: Toast['type']): string {
    switch (type) {
      case 'success': return 'bg-gradient-to-br from-white via-green-50/50 to-green-100/30 border-l-4 border-green-500';
      case 'error': return 'bg-gradient-to-br from-white via-red-50/50 to-red-100/30 border-l-4 border-red-500';
      case 'warning': return 'bg-gradient-to-br from-white via-yellow-50/50 to-yellow-100/30 border-l-4 border-yellow-500';
      case 'info': return 'bg-gradient-to-br from-white via-blue-50/50 to-blue-100/30 border-l-4 border-blue-500';
      default: return 'bg-gradient-to-br from-white via-gray-50/50 to-gray-100/30 border-l-4 border-gray-500';
    }
  }

  getIconBackgroundClasses(type: Toast['type']): string {
    switch (type) {
      case 'success': return 'flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 ring-2 ring-green-500/30 shadow-sm';
      case 'error': return 'flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-red-100 to-red-200 ring-2 ring-red-500/30 shadow-sm';
      case 'warning': return 'flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 ring-2 ring-yellow-500/30 shadow-sm';
      case 'info': return 'flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 ring-2 ring-blue-500/30 shadow-sm';
      default: return 'flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-gray-500/30 shadow-sm';
    }
  }

  getIconClasses(type: Toast['type']): string {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }

  getTitleClasses(type: Toast['type']): string {
    switch (type) {
      case 'success': return 'text-green-900';
      case 'error': return 'text-red-900';
      case 'warning': return 'text-yellow-900';
      case 'info': return 'text-blue-900';
      default: return 'text-gray-900';
    }
  }

  getMessageClasses(type: Toast['type']): string {
    switch (type) {
      case 'success': return 'text-green-800';
      case 'error': return 'text-red-800';
      case 'warning': return 'text-yellow-800';
      case 'info': return 'text-blue-800';
      default: return 'text-gray-800';
    }
  }

  getCloseButtonClasses(type: Toast['type']): string {
    switch (type) {
      case 'success': return 'text-green-500 hover:text-green-700 hover:bg-green-100 focus:ring-green-500';
      case 'error': return 'text-red-500 hover:text-red-700 hover:bg-red-100 focus:ring-red-500';
      case 'warning': return 'text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100 focus:ring-yellow-500';
      case 'info': return 'text-blue-500 hover:text-blue-700 hover:bg-blue-100 focus:ring-blue-500';
      default: return 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:ring-gray-500';
    }
  }
}

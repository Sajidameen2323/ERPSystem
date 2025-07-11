import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertTriangle, Check, X } from 'lucide-angular';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  details?: string[];
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
         *ngIf="isVisible" 
         (click)="onBackdropClick($event)">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200"
           (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="flex items-center p-6 border-b">
          <div class="flex items-center space-x-3">
            <div [ngClass]="getIconClasses()">
              <lucide-icon 
                [img]="icons.AlertTriangle" 
                *ngIf="config.type === 'warning' || config.type === 'danger'"
                class="w-6 h-6">
              </lucide-icon>
              <lucide-icon 
                [img]="icons.Check" 
                *ngIf="config.type === 'success'"
                class="w-6 h-6">
              </lucide-icon>
              <lucide-icon 
                [img]="icons.AlertTriangle" 
                *ngIf="config.type === 'info' || !config.type"
                class="w-6 h-6">
              </lucide-icon>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">{{ config.title }}</h3>
          </div>
          <button 
            (click)="onCancel()"
            class="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
            <lucide-icon [img]="icons.X" class="w-5 h-5"></lucide-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <p class="text-gray-600 mb-4">{{ config.message }}</p>
          
          <!-- Details list if provided -->
          <div *ngIf="config.details && config.details.length > 0" 
               class="bg-gray-50 rounded-md p-3 mb-4">
            <p class="text-sm font-medium text-gray-700 mb-2">Details:</p>
            <ul class="text-sm text-gray-600 space-y-1">
              <li *ngFor="let detail of config.details" class="flex items-start">
                <span class="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {{ detail }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button 
            (click)="onCancel()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            {{ config.cancelText || 'Cancel' }}
          </button>
          <button 
            (click)="onConfirm()"
            [ngClass]="getConfirmButtonClasses()"
            class="px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors">
            {{ config.confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent {
  @Input() isVisible = false;
  @Input() config: ConfirmationConfig = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?'
  };

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() visibilityChanged = new EventEmitter<boolean>();

  readonly icons = {
    AlertTriangle,
    Check,
    X
  };

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onConfirm() {
    this.confirmed.emit();
    this.hide();
  }

  onCancel() {
    this.cancelled.emit();
    this.hide();
  }

  private hide() {
    this.isVisible = false;
    this.visibilityChanged.emit(false);
  }

  getIconClasses(): string {
    const baseClasses = 'flex items-center justify-center w-10 h-10 rounded-full';
    
    switch (this.config.type) {
      case 'danger':
        return `${baseClasses} bg-red-100 text-red-600`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-600`;
      case 'success':
        return `${baseClasses} bg-green-100 text-green-600`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-100 text-blue-600`;
    }
  }

  getConfirmButtonClasses(): string {
    const baseClasses = 'text-white font-medium';
    
    switch (this.config.type) {
      case 'danger':
        return `${baseClasses} bg-red-600 hover:bg-red-700 focus:ring-red-500`;
      case 'warning':
        return `${baseClasses} bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500`;
      case 'success':
        return `${baseClasses} bg-green-600 hover:bg-green-700 focus:ring-green-500`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`;
    }
  }
}

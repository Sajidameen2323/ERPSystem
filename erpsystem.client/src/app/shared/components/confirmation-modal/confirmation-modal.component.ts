import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, AlertTriangle, Check, X } from 'lucide-angular';

export interface ConfirmationInputField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email';
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  rows?: number; // for textarea
}

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  details?: string[];
  inputFields?: ConfirmationInputField[];
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
         *ngIf="isVisible" 
         (click)="onBackdropClick($event)">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200"
           (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="flex items-center p-6 border-b border-gray-200 dark:border-gray-700">
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
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ config.title }}</h3>
          </div>
          <button 
            (click)="onCancel()"
            class="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <lucide-icon [img]="icons.X" class="w-5 h-5"></lucide-icon>
          </button>
        </div>

        <!-- Body -->
        <form [formGroup]="form" (ngSubmit)="onConfirm()">
          <div class="p-6">
            <p class="text-gray-600 dark:text-gray-300 mb-4">{{ config.message }}</p>
            
            <!-- Details list if provided -->
            <div *ngIf="config.details && config.details.length > 0" 
                 class="bg-gray-50 dark:bg-gray-700 rounded-md p-3 mb-4">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details:</p>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li *ngFor="let detail of config.details" class="flex items-start">
                  <span class="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {{ detail }}
                </li>
              </ul>
            </div>

            <!-- Input Fields -->
            <div *ngIf="config.inputFields && config.inputFields.length > 0" class="space-y-4">
              <div *ngFor="let field of config.inputFields">
                
                <!-- Text Input -->
                <div *ngIf="field.type === 'text' || field.type === 'email' || field.type === 'number'">
                  <label [for]="field.key" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ field.label }}
                    <span *ngIf="field.required" class="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    [id]="field.key"
                    [type]="field.type"
                    [formControlName]="field.key"
                    [placeholder]="field.placeholder || ''"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  >
                  <div *ngIf="form.get(field.key)?.invalid && form.get(field.key)?.touched" class="mt-1 text-sm text-red-600 dark:text-red-400">
                    <div *ngIf="form.get(field.key)?.errors?.['required']">{{ field.label }} is required</div>
                    <div *ngIf="form.get(field.key)?.errors?.['minlength']">{{ field.label }} must be at least {{ field.minLength }} characters</div>
                    <div *ngIf="form.get(field.key)?.errors?.['maxlength']">{{ field.label }} cannot exceed {{ field.maxLength }} characters</div>
                    <div *ngIf="form.get(field.key)?.errors?.['email']">Please enter a valid email address</div>
                  </div>
                </div>

                <!-- Textarea -->
                <div *ngIf="field.type === 'textarea'">
                  <label [for]="field.key" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ field.label }}
                    <span *ngIf="field.required" class="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    [id]="field.key"
                    [formControlName]="field.key"
                    [placeholder]="field.placeholder || ''"
                    [rows]="field.rows || 3"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-vertical"
                  ></textarea>
                  <div *ngIf="form.get(field.key)?.invalid && form.get(field.key)?.touched" class="mt-1 text-sm text-red-600 dark:text-red-400">
                    <div *ngIf="form.get(field.key)?.errors?.['required']">{{ field.label }} is required</div>
                    <div *ngIf="form.get(field.key)?.errors?.['minlength']">{{ field.label }} must be at least {{ field.minLength }} characters</div>
                    <div *ngIf="form.get(field.key)?.errors?.['maxlength']">{{ field.label }} cannot exceed {{ field.maxLength }} characters</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex justify-end space-x-3 px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button"
              (click)="onCancel()"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              {{ config.cancelText || 'Cancel' }}
            </button>
            <button 
              type="submit"
              [disabled]="!form.valid"
              [ngClass]="getConfirmButtonClasses()"
              class="px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {{ config.confirmText || 'Confirm' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent implements OnChanges {
  @Input() isVisible = false;
  @Input() config: ConfirmationConfig = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?'
  };

  @Output() confirmed = new EventEmitter<{[key: string]: any}>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() visibilityChanged = new EventEmitter<boolean>();

  form: FormGroup;

  readonly icons = {
    AlertTriangle,
    Check,
    X
  };

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
  }

  ngOnChanges() {
    this.buildForm();
  }

  private buildForm(): void {
    const formControls: {[key: string]: any} = {};
    
    if (this.config.inputFields) {
      this.config.inputFields.forEach(field => {
        const validators = [];
        
        if (field.required) {
          validators.push(Validators.required);
        }
        
        if (field.minLength) {
          validators.push(Validators.minLength(field.minLength));
        }
        
        if (field.maxLength) {
          validators.push(Validators.maxLength(field.maxLength));
        }
        
        if (field.type === 'email') {
          validators.push(Validators.email);
        }
        
        formControls[field.key] = ['', validators];
      });
    }
    
    this.form = this.fb.group(formControls);
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onConfirm() {
    if (this.config.inputFields && this.config.inputFields.length > 0) {
      if (this.form.valid) {
        this.confirmed.emit(this.form.value);
        this.hide();
      } else {
        // Mark all fields as touched to show validation errors
        Object.keys(this.form.controls).forEach(key => {
          this.form.get(key)?.markAsTouched();
        });
      }
    } else {
      this.confirmed.emit({});
      this.hide();
    }
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

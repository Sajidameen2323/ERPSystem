import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, UserPlus, Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';
import { FormErrorHandlerService } from '../../../core/services/form-error-handler.service';
import { RegisterRequest } from '../../../core/models';

@Component({
  selector: 'app-user-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation Header -->
      <div class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div class="flex items-center">
              <button
                routerLink="/users"
                class="mr-4 inline-flex items-center p-2 border border-transparent rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <lucide-icon [img]="arrowLeftIcon" class="h-5 w-5"></lucide-icon>
              </button>
              <lucide-icon [img]="userPlusIcon" class="h-6 w-6 text-gray-400 mr-3"></lucide-icon>
              <h1 class="text-2xl font-bold text-gray-900">Add New User</h1>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <main class="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="bg-white shadow overflow-hidden sm:rounded-lg">
            <div class="px-4 py-5 sm:px-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">User Information</h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">Enter the details for the new user account.</p>
            </div>
            <div class="border-t border-gray-200">
              <div class="px-4 py-5 sm:p-6">
                <!-- Register Form -->
                <form class="space-y-6" [formGroup]="registerForm" (ngSubmit)="onSubmit()">
                  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <!-- First Name -->
                    <div>
                      <label for="firstName" class="block text-sm font-medium text-gray-700">First Name</label>
                      <div class="mt-1 relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <lucide-icon [img]="userIcon" class="h-5 w-5 text-gray-400"></lucide-icon>
                        </div>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          formControlName="firstName"
                          class="appearance-none block w-full px-3 py-2 pl-10 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          [class.border-red-300]="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched"
                          [class.border-gray-300]="!(registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched)"
                          placeholder="First Name"
                        >
                      </div>
                      <div *ngIf="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched" class="mt-1 text-sm text-red-600">
                        <div>{{ formErrorHandler.getErrorMessage('firstName', registerForm.get('firstName')?.errors) }}</div>
                      </div>
                    </div>

                    <!-- Last Name -->
                    <div>
                      <label for="lastName" class="block text-sm font-medium text-gray-700">Last Name</label>
                      <div class="mt-1 relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <lucide-icon [img]="userIcon" class="h-5 w-5 text-gray-400"></lucide-icon>
                        </div>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          formControlName="lastName"
                          class="appearance-none block w-full px-3 py-2 pl-10 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          [class.border-red-300]="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched"
                          [class.border-gray-300]="!(registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched)"
                          placeholder="Last Name"
                        >
                      </div>
                      <div *ngIf="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched" class="mt-1 text-sm text-red-600">
                        <div>{{ formErrorHandler.getErrorMessage('lastName', registerForm.get('lastName')?.errors) }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Email Field -->
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                    <div class="mt-1 relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <lucide-icon [img]="mailIcon" class="h-5 w-5 text-gray-400"></lucide-icon>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autocomplete="email"
                        formControlName="email"
                        class="appearance-none block w-full px-3 py-2 pl-10 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        [class.border-red-300]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
                        [class.border-gray-300]="!(registerForm.get('email')?.invalid && registerForm.get('email')?.touched)"
                        placeholder="Email address"
                      >
                    </div>
                    <div *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched" class="mt-1 text-sm text-red-600">
                      <div>{{ formErrorHandler.getErrorMessage('email', registerForm.get('email')?.errors) }}</div>
                    </div>
                  </div>

                  <!-- Phone Number Field -->
                  <div>
                    <label for="phoneNumber" class="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                    <div class="mt-1 relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <lucide-icon [img]="phoneIcon" class="h-5 w-5 text-gray-400"></lucide-icon>
                      </div>
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        formControlName="phoneNumber"
                        class="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Phone number"
                      >
                    </div>
                  </div>

                  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <!-- Password Field -->
                    <div>
                      <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                      <div class="mt-1 relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <lucide-icon [img]="lockIcon" class="h-5 w-5 text-gray-400"></lucide-icon>
                        </div>
                        <input
                          id="password"
                          name="password"
                          [type]="showPassword ? 'text' : 'password'"
                          formControlName="password"
                          class="appearance-none block w-full px-3 py-2 pl-10 pr-10 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          [class.border-red-300]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
                          [class.border-gray-300]="!(registerForm.get('password')?.invalid && registerForm.get('password')?.touched)"
                          placeholder="Password"
                        >
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            class="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                            (click)="togglePasswordVisibility()"
                          >
                            <lucide-icon [img]="showPassword ? eyeOffIcon : eyeIcon" class="h-5 w-5"></lucide-icon>
                          </button>
                        </div>
                      </div>
                      <div *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched" class="mt-1 text-sm text-red-600">
                        <div>{{ formErrorHandler.getErrorMessage('password', registerForm.get('password')?.errors) }}</div>
                      </div>
                    </div>

                    <!-- Confirm Password Field -->
                    <div>
                      <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                      <div class="mt-1 relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <lucide-icon [img]="lockIcon" class="h-5 w-5 text-gray-400"></lucide-icon>
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          [type]="showConfirmPassword ? 'text' : 'password'"
                          formControlName="confirmPassword"
                          class="appearance-none block w-full px-3 py-2 pl-10 pr-10 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          [class.border-red-300]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched"
                          [class.border-gray-300]="!(registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched)"
                          placeholder="Confirm password"
                        >
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            class="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                            (click)="toggleConfirmPasswordVisibility()"
                          >
                            <lucide-icon [img]="showConfirmPassword ? eyeOffIcon : eyeIcon" class="h-5 w-5"></lucide-icon>
                          </button>
                        </div>
                      </div>
                      <div *ngIf="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched" class="mt-1 text-sm text-red-600">
                        <div>{{ formErrorHandler.getErrorMessage('confirmPassword', registerForm.get('confirmPassword')?.errors) }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Submit Button -->
                  <div class="pt-5">
                    <div class="flex justify-end space-x-3">
                      <button
                        type="button"
                        routerLink="/users"
                        class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        [disabled]="registerForm.invalid || (loadingService.loading$ | async)"
                        class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <lucide-icon [img]="userPlusIcon" class="h-4 w-4 mr-2"></lucide-icon>
                        <span *ngIf="!(loadingService.loading$ | async)">Create User</span>
                        <span *ngIf="loadingService.loading$ | async" class="flex items-center">
                          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class UserAddComponent {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;

  // Lucide icons
  readonly userPlusIcon = UserPlus;
  readonly mailIcon = Mail;
  readonly lockIcon = Lock;
  readonly userIcon = User;
  readonly phoneIcon = Phone;
  readonly eyeIcon = Eye;
  readonly eyeOffIcon = EyeOff;
  readonly arrowLeftIcon = ArrowLeft;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    public loadingService: LoadingService,
    public formErrorHandler: FormErrorHandlerService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      password: ['', [
        Validators.required, 
        Validators.minLength(8), 
        Validators.maxLength(100),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Clear server errors when user starts typing
    this.registerForm.valueChanges.subscribe(() => {
      this.formErrorHandler.clearServerErrors(this.registerForm);
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      confirmPassword.setErrors(null);
      return null;
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loadingService.show();
      
      const registerRequest: RegisterRequest = {
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName,
        email: this.registerForm.value.email,
        phoneNumber: this.registerForm.value.phoneNumber || undefined,
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword
      };

      this.authService.register(registerRequest).subscribe({
        next: (authResponse) => {
          this.loadingService.hide();
          this.toastService.success(
            'User Created Successfully!', 
            `User ${authResponse.user.firstName} ${authResponse.user.lastName} has been created.`
          );
          this.router.navigate(['/users']);
        },
        error: (error) => {
          this.loadingService.hide();
          
          // Try to map server validation errors to form fields
          const hasFieldErrors = this.formErrorHandler.mapServerErrorsToForm(this.registerForm, error);
          
          // Show toast message
          if (hasFieldErrors) {
            this.toastService.error('Validation Error', 'Please correct the highlighted fields.');
          } else {
            this.toastService.error('User Creation Failed', error.message || 'Please try again.');
          }
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }
}

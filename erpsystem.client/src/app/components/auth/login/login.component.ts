import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';
import { LoginRequest } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div>
          <div class="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <lucide-icon [img]="logInIcon" class="h-6 w-6 text-white"></lucide-icon>
          </div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Welcome to MicroBiz Hub ERP System
          </p>
        </div>

        <!-- Login Form -->
        <form class="mt-8 space-y-6" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <input type="hidden" name="remember" value="true">
          <div class="rounded-md shadow-sm -space-y-px">
            <!-- Email Field -->
            <div>
              <label for="email" class="sr-only">Email address</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <lucide-icon [img]="mailIcon" class="h-5 w-5 text-gray-400"></lucide-icon>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  formControlName="email"
                  class="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  [class.border-red-300]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                  [class.border-gray-300]="!(loginForm.get('email')?.invalid && loginForm.get('email')?.touched)"
                  placeholder="Email address"
                >
              </div>
              <div *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="mt-1 text-sm text-red-600">
                <div *ngIf="loginForm.get('email')?.errors?.['required']">Email is required</div>
                <div *ngIf="loginForm.get('email')?.errors?.['email']">Please enter a valid email</div>
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="sr-only">Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <lucide-icon [img]="lockIcon" class="h-5 w-5 text-gray-400"></lucide-icon>
                </div>
                <input
                  id="password"
                  name="password"
                  [type]="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  formControlName="password"
                  class="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 pr-10 border placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  [class.border-red-300]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                  [class.border-gray-300]="!(loginForm.get('password')?.invalid && loginForm.get('password')?.touched)"
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
              <div *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" class="mt-1 text-sm text-red-600">
                <div *ngIf="loginForm.get('password')?.errors?.['required']">Password is required</div>
                <div *ngIf="loginForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</div>
              </div>
            </div>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              >
              <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div class="text-sm">
              <a href="#" class="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              [disabled]="loginForm.invalid || (loadingService.loading$ | async)"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <lucide-icon [img]="logInIcon" class="h-5 w-5 text-blue-500 group-hover:text-blue-400"></lucide-icon>
              </span>
              <span *ngIf="!(loadingService.loading$ | async)">Sign in</span>
              <span *ngIf="loadingService.loading$ | async" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  returnUrl = '/dashboard';

  // Lucide icons
  readonly logInIcon = LogIn;
  readonly mailIcon = Mail;
  readonly lockIcon = Lock;
  readonly eyeIcon = Eye;
  readonly eyeOffIcon = EyeOff;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    public loadingService: LoadingService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Get return URL from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loadingService.show();
      
      const loginRequest: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(loginRequest).subscribe({
        next: (authResponse) => {
          this.loadingService.hide();
          this.toastService.success('Welcome back!', `Hello ${authResponse.user.firstName}!`);
          this.router.navigate([this.returnUrl]);
        },
        error: (error) => {
          this.loadingService.hide();
          this.toastService.error('Login Failed', error.message || 'Please check your credentials and try again.');
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}

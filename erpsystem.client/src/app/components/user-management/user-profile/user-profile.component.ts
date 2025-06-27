import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, User, Mail, Phone, Save, ArrowLeft } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';
import { UserProfile, UpdateProfileRequest } from '../../../core/models';

@Component({
  selector: 'app-user-profile',
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
                routerLink="/dashboard"
                class="mr-4 inline-flex items-center p-2 border border-transparent rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <lucide-icon [img]="arrowLeftIcon" class="h-5 w-5"></lucide-icon>
              </button>
              <lucide-icon [img]="userIcon" class="h-6 w-6 text-gray-400 mr-3"></lucide-icon>
              <h1 class="text-2xl font-bold text-gray-900">My Profile</h1>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <main class="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Profile Information -->
          <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div class="px-4 py-5 sm:px-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">Personal details and account information.</p>
            </div>
            
            <div *ngIf="currentUser" class="border-t border-gray-200">
              <dl>
                <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">Email address</dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ currentUser.email }}</dd>
                </div>
                <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">Account Status</dt>
                  <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                    <span [class]="currentUser.isActive ? 'text-green-600' : 'text-red-600'">
                      {{ currentUser.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </dd>
                </div>
                <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">Roles</dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span *ngFor="let role of currentUser.roles; let last = last" 
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                      {{ role }}
                    </span>
                  </dd>
                </div>
                <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">Member since</dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {{ currentUser.createdAt | date:'medium' }}
                  </dd>
                </div>
                <div *ngIf="currentUser.lastLoginAt" class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">Last login</dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {{ currentUser.lastLoginAt | date:'medium' }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Edit Profile Form -->
          <div class="bg-white shadow sm:rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Update Profile</h3>
              <div class="mt-2 max-w-xl text-sm text-gray-500">
                <p>Update your personal information.</p>
              </div>
              
              <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="mt-5">
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <!-- First Name -->
                  <div>
                    <label for="firstName" class="block text-sm font-medium text-gray-700">First Name</label>
                    <div class="mt-1 relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <lucide-icon [img]="userIcon" class="h-5 w-5 text-gray-400"></lucide-icon>
                      </div>
                      <input
                        type="text"
                        id="firstName"
                        formControlName="firstName"
                        class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        [class.border-red-300]="profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched"
                      >
                    </div>
                    <div *ngIf="profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched" class="mt-1 text-sm text-red-600">
                      First name is required
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
                        type="text"
                        id="lastName"
                        formControlName="lastName"
                        class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        [class.border-red-300]="profileForm.get('lastName')?.invalid && profileForm.get('lastName')?.touched"
                      >
                    </div>
                    <div *ngIf="profileForm.get('lastName')?.invalid && profileForm.get('lastName')?.touched" class="mt-1 text-sm text-red-600">
                      Last name is required
                    </div>
                  </div>

                  <!-- Phone Number -->
                  <div class="sm:col-span-2">
                    <label for="phoneNumber" class="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div class="mt-1 relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <lucide-icon [img]="phoneIcon" class="h-5 w-5 text-gray-400"></lucide-icon>
                      </div>
                      <input
                        type="tel"
                        id="phoneNumber"
                        formControlName="phoneNumber"
                        class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Optional"
                      >
                    </div>
                  </div>
                </div>

                <div class="mt-6 flex justify-end">
                  <button
                    type="submit"
                    [disabled]="profileForm.invalid || (loadingService.loading$ | async)"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <lucide-icon [img]="saveIcon" class="h-4 w-4 mr-2"></lucide-icon>
                    <span *ngIf="!(loadingService.loading$ | async)">Update Profile</span>
                    <span *ngIf="loadingService.loading$ | async" class="flex items-center">
                      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class UserProfileComponent implements OnInit {
  currentUser: UserProfile | null = null;
  profileForm: FormGroup;

  // Lucide icons
  readonly userIcon = User;
  readonly mailIcon = Mail;
  readonly phoneIcon = Phone;
  readonly saveIcon = Save;
  readonly arrowLeftIcon = ArrowLeft;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private toastService: ToastService,
    public loadingService: LoadingService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phoneNumber: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        phoneNumber: this.currentUser.phoneNumber || ''
      });
    }
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      this.loadingService.show();

      const updateRequest: UpdateProfileRequest = {
        firstName: this.profileForm.value.firstName,
        lastName: this.profileForm.value.lastName,
        phoneNumber: this.profileForm.value.phoneNumber || undefined
      };

      this.userService.updateProfile(updateRequest).subscribe({
        next: (updatedUser) => {
          this.loadingService.hide();
          this.currentUser = updatedUser;
          this.toastService.success('Profile Updated', 'Your profile has been updated successfully.');
          
          // Update the user in auth service
          const currentAuth = this.authService.getCurrentUser();
          if (currentAuth) {
            const updatedAuthUser = { ...currentAuth, ...updatedUser };
            localStorage.setItem('current_user', JSON.stringify(updatedAuthUser));
          }
        },
        error: (error) => {
          this.loadingService.hide();
          this.toastService.error('Update Failed', error.message || 'Failed to update profile.');
        }
      });
    } else {
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
    }
  }
}

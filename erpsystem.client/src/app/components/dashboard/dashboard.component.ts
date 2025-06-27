import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Users, LogOut, User } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UserProfile } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="dashboardIcon" class="h-5 w-5 text-white"></lucide-icon>
                </div>
              </div>
              <div class="ml-4">
                <h1 class="text-xl font-semibold text-gray-900">MicroBiz Hub ERP</h1>
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-700">
                Welcome, {{ currentUser?.firstName }} {{ currentUser?.lastName }}
              </div>
              <div class="relative">
                <button
                  type="button"
                  class="flex items-center p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                  (click)="logout()"
                >
                  <lucide-icon [img]="logoutIcon" class="h-5 w-5"></lucide-icon>
                  <span class="ml-2 text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div class="text-center">
              <lucide-icon [img]="dashboardIcon" class="mx-auto h-12 w-12 text-gray-400"></lucide-icon>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Dashboard</h3>
              <p class="mt-1 text-sm text-gray-500">
                Welcome to MicroBiz Hub ERP System - Module 1: User Management & Authentication
              </p>
              
              <div class="mt-6">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <!-- User Profile Card -->
                  <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                      <div class="flex items-center">
                        <div class="flex-shrink-0">
                          <lucide-icon [img]="userIcon" class="h-6 w-6 text-gray-400"></lucide-icon>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                          <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">Your Profile</dt>
                            <dd class="text-lg font-medium text-gray-900">{{ currentUser?.email }}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div class="bg-gray-50 px-5 py-3">
                      <div class="text-sm">
                        <a routerLink="/profile" class="font-medium text-blue-600 hover:text-blue-500">
                          View profile
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- User Management Card (Admin/Manager only) -->
                  <div *ngIf="hasManagerAccess" class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                      <div class="flex items-center">
                        <div class="flex-shrink-0">
                          <lucide-icon [img]="usersIcon" class="h-6 w-6 text-gray-400"></lucide-icon>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                          <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">User Management</dt>
                            <dd class="text-lg font-medium text-gray-900">Manage Users</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div class="bg-gray-50 px-5 py-3">
                      <div class="text-sm">
                        <a routerLink="/users" class="font-medium text-blue-600 hover:text-blue-500">
                          Manage users
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- Role Information Card -->
                  <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                      <div class="flex items-center">
                        <div class="flex-shrink-0">
                          <div class="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                            <div class="h-3 w-3 bg-green-600 rounded-full"></div>
                          </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                          <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">Your Roles</dt>
                            <dd class="text-lg font-medium text-gray-900">
                              {{ currentUser?.roles?.join(', ') || 'No roles assigned' }}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  currentUser: UserProfile | null = null;
  hasManagerAccess = false;

  // Lucide icons
  readonly dashboardIcon = LayoutDashboard;
  readonly usersIcon = Users;
  readonly userIcon = User;
  readonly logoutIcon = LogOut;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.hasManagerAccess = this.authService.hasAnyRole(['Admin', 'Manager']);
  }

  logout(): void {
    this.authService.logout();
    this.toastService.info('Logged Out', 'You have been successfully logged out.');
  }
}

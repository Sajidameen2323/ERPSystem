import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Users, Plus, Search, Filter } from 'lucide-angular';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';
import { UserManagement, PaginationParams } from '../../../core/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation Header -->
      <div class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div class="flex items-center">
              <lucide-icon [img]="usersIcon" class="h-6 w-6 text-gray-400 mr-3"></lucide-icon>
              <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
            </div>
            <div class="flex items-center space-x-3">
              <button
                type="button"
                routerLink="/users/add"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <lucide-icon [img]="plusIcon" class="h-4 w-4 mr-2"></lucide-icon>
                Add User
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Search and Filter -->
          <div class="bg-white shadow rounded-lg p-6 mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div class="flex-1 min-w-0">
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <lucide-icon [img]="searchIcon" class="h-5 w-5 text-gray-400"></lucide-icon>
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    class="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  >
                </div>
              </div>
              <div class="flex space-x-3">
                <button
                  type="button"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <lucide-icon [img]="filterIcon" class="h-4 w-4 mr-2"></lucide-icon>
                  Filter
                </button>
              </div>
            </div>
          </div>

          <!-- Users Table -->
          <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <div *ngIf="loadingService.loading$ | async" class="p-6 text-center">
              <div class="inline-flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading users...
              </div>
            </div>

            <ul *ngIf="!(loadingService.loading$ | async)" role="list" class="divide-y divide-gray-200">
              <li *ngFor="let user of users" class="px-6 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-700">
                          {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ user.firstName }} {{ user.lastName }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ user.email }}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-4">
                    <div class="flex flex-col items-end">
                      <div class="text-sm text-gray-900">
                        {{ user.roles.join(', ') }}
                      </div>
                      <div class="text-sm text-gray-500">
                        <span [class]="user.isActive ? 'text-green-600' : 'text-red-600'">
                          {{ user.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </div>
                    </div>
                    <div class="flex-shrink-0" *ngIf="isAdmin">
                      <button
                        type="button"
                        [routerLink]="['/users/edit', user.id]"
                        class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            </ul>

            <!-- Empty State -->
            <div *ngIf="users.length === 0 && !(loadingService.loading$ | async)" class="text-center py-12">
              <lucide-icon [img]="usersIcon" class="mx-auto h-12 w-12 text-gray-400"></lucide-icon>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p class="mt-1 text-sm text-gray-500">Get started by adding a new user.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class UserListComponent implements OnInit {
  users: UserManagement[] = [];

  // Lucide icons
  readonly usersIcon = Users;
  readonly plusIcon = Plus;
  readonly searchIcon = Search;
  readonly filterIcon = Filter;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService,
    public loadingService: LoadingService
  ) {}

  get isAdmin(): boolean {
    return this.authService.hasRole('Admin');
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loadingService.show();
    
    const pagination: PaginationParams = {
      page: 1,
      pageSize: 20,
      sortBy: 'firstName',
      sortDirection: 'asc'
    };

    this.userService.getUsers(pagination).subscribe({
      next: (result) => {
        console.log(result);
        this.users = result.items || [];
        console.log(this.users);
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        this.toastService.error('Error', 'Failed to load users');
      }
    });
  }
}

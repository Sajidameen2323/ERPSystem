import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Search, UserPlus, Edit, Trash2, MoreVertical, CheckCircle, XCircle } from 'lucide-angular';
import { UserService } from '../../core/services/user.service';
import { User, UserSearchRequest, PagedResult, Result } from '../../core/models/user.interface';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  readonly icons = {
    Search,
    UserPlus,
    Edit,
    Trash2,
    MoreVertical,
    CheckCircle,
    XCircle
  };

  // Make Math available in template
  readonly Math = Math;

  users: User[] = [];
  searchRequest: UserSearchRequest = {
    searchTerm: '',
    isActive: undefined,
    page: 1,
    pageSize: 10
  };
  
  pagedResult: PagedResult<User> | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = null;

    this.userService.getUsers(this.searchRequest).subscribe({
      next: (result: Result<PagedResult<User>>) => {
        this.loading = false;
        if (result.isSuccess && result.data) {
          this.pagedResult = result.data;
          this.users = result.data.items; // PagedResult has 'items' not 'data'
        } else {
          this.error = result.message || result.error || 'Failed to load users';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to load users: ' + (error.error?.message || error.message);
      }
    });
  }

  onSearch() {
    this.searchRequest.page = 1; // Reset to first page
    this.loadUsers();
  }

  onPageChange(page: number) {
    this.searchRequest.page = page;
    this.loadUsers();
  }

  onFilterChange() {
    this.searchRequest.page = 1; // Reset to first page
    this.loadUsers();
  }

  navigateToRegister() {
    this.router.navigate(['/dashboard/admin/register']);
  }

  editUser(user: User) {
    this.router.navigate(['/dashboard/admin/edit-user', user.id]);
  }

  toggleUserStatus(user: User) {
    const action = user.isActive ? 
      this.userService.deactivateUser(user.id) : 
      this.userService.activateUser(user.id);

    action.subscribe({
      next: (result) => {
        if (result.isSuccess) {
          this.loadUsers(); // Refresh the list
        } else {
          this.error = result.message || result.error || 'Failed to update user status';
        }
      },
      error: (error) => {
        this.error = 'Failed to update user status: ' + (error.error?.message || error.message);
      }
    });
  }

  getUserStatusBadgeClass(isActive: boolean): string {
    return isActive ? 
      'bg-green-100 text-green-800' : 
      'bg-red-100 text-red-800';
  }

  getRoleBadgeClass(role: string): string {
    const roleClasses: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800',
      'salesuser': 'bg-blue-100 text-blue-800',
      'inventoryuser': 'bg-green-100 text-green-800'
    };
    return roleClasses[role] || 'bg-gray-100 text-gray-800';
  }

  getPageNumbers(): number[] {
    if (!this.pagedResult) return [];
    
    const totalPages = this.pagedResult.totalPages;
    const currentPage = this.pagedResult.currentPage;
    const pages: number[] = [];
    
    // Show up to 5 pages around current page
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}

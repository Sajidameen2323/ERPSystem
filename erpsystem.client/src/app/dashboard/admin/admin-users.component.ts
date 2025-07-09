import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Search, UserPlus, CheckSquare, Square } from 'lucide-angular';
import { UserService } from '../../core/services/user.service';
import { User, UserSearchRequest, PagedResult, Result } from '../../core/models/user.interface';
import { AgGridTableComponent, AgGridConfig, BulkActionsComponent, BulkAction } from '../../shared';
import { UserGridService } from '../../shared/services/user-grid.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AgGridTableComponent, BulkActionsComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  @ViewChild(AgGridTableComponent) gridComponent!: AgGridTableComponent;
  
  readonly icons = {
    Search,
    UserPlus,
    CheckSquare,
    Square
  };

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
  gridConfig: AgGridConfig<User>;
  
  // Multi-select and bulk actions
  selectedUsers: User[] = [];
  selectedCount = 0;

  constructor(
    private userService: UserService,
    private router: Router,
    private userGridService: UserGridService
  ) {
    // Initialize grid config with empty data
    this.gridConfig = this.userGridService.createUserGridConfig(
      [],
      true,
      null,
      (user) => this.editUser(user),
      (user) => this.toggleUserStatus(user),
      true // Always enable multi-select for user table
    );
  }

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
          this.users = result.data.items.map(el => { return { ...el, isActive: el.status === "ACTIVE" } }); // PagedResult has 'items' not 'data'
          this.updateGridConfig();
        } else {
          this.error = result.message || result.error || 'Failed to load users';
          this.updateGridConfig();
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to load users: ' + (error.error?.message || error.message);
        this.updateGridConfig();
      }
    });
  }

  private updateGridConfig() {
    this.gridConfig = this.userGridService.createUserGridConfig(
      this.users,
      this.loading,
      this.error,
      (user) => this.editUser(user),
      (user) => this.toggleUserStatus(user),
      true // Always enable multi-select for user table
    );
  }

  onSearch() {
    this.searchRequest.page = 1; // Reset to first page
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
          this.updateGridConfig();
        }
      },
      error: (error) => {
        this.error = 'Failed to update user status: ' + (error.error?.message || error.message);
        this.updateGridConfig();
      }
    });
  }



  onSelectedRowsChanged(selectedRows: User[]) {
    this.selectedUsers = selectedRows;
    this.selectedCount = selectedRows.length;
  }

  onClearSelection() {
    if (this.gridComponent) {
      this.gridComponent.clearSelection();
    }
  }

  // Bulk actions
  onBulkAction(actionId: string) {
    switch (actionId) {
      case 'activate':
        this.bulkActivateUsers();
        break;
      case 'deactivate':
        this.bulkDeactivateUsers();
        break;
      case 'export':
        this.exportSelectedUsers();
        break;
      case 'delete':
        this.bulkDeleteUsers();
        break;
    }
  }

  private bulkActivateUsers() {
    if (this.selectedUsers.length === 0) return;
    
    const inactiveUsers = this.selectedUsers.filter(user => !user.isActive);
    if (inactiveUsers.length === 0) {
      alert('Selected users are already active.');
      return;
    }

    if (confirm(`Are you sure you want to activate ${inactiveUsers.length} user(s)?`)) {
      // Here you would implement bulk activation
      // For now, we'll process them one by one
      this.processBulkStatusChange(inactiveUsers, true);
    }
  }

  private bulkDeactivateUsers() {
    if (this.selectedUsers.length === 0) return;
    
    const activeUsers = this.selectedUsers.filter(user => user.isActive);
    if (activeUsers.length === 0) {
      alert('Selected users are already inactive.');
      return;
    }

    if (confirm(`Are you sure you want to deactivate ${activeUsers.length} user(s)?`)) {
      // Here you would implement bulk deactivation
      // For now, we'll process them one by one
      this.processBulkStatusChange(activeUsers, false);
    }
  }

  private processBulkStatusChange(users: User[], activate: boolean) {
    let completed = 0;
    let errors: string[] = [];

    users.forEach(user => {
      const action = activate ? 
        this.userService.activateUser(user.id) : 
        this.userService.deactivateUser(user.id);

      action.subscribe({
        next: (result) => {
          completed++;
          if (!result.isSuccess) {
            errors.push(`${user.firstName} ${user.lastName}: ${result.message || result.error}`);
          }
          
          if (completed === users.length) {
            this.handleBulkActionComplete(errors);
          }
        },
        error: (error) => {
          completed++;
          errors.push(`${user.firstName} ${user.lastName}: ${error.error?.message || error.message}`);
          
          if (completed === users.length) {
            this.handleBulkActionComplete(errors);
          }
        }
      });
    });
  }

  private handleBulkActionComplete(errors: string[]) {
    if (errors.length > 0) {
      alert(`Bulk action completed with errors:\n${errors.join('\n')}`);
    } else {
      alert('Bulk action completed successfully!');
    }
    
    this.loadUsers(); // Refresh the list
    this.onClearSelection(); // Clear selection
  }

  private exportSelectedUsers() {
    if (this.selectedUsers.length === 0) return;
    
    // Create CSV content
    const headers = ['First Name', 'Last Name', 'Email', 'Status', 'Roles'];
    const csvContent = [
      headers.join(','),
      ...this.selectedUsers.map(user => [
        user.firstName,
        user.lastName,
        user.email,
        user.isActive ? 'Active' : 'Inactive',
        Array.isArray(user.roles) ? user.roles.join('; ') : (user.roles || '')
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    // Download the CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-users-${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private bulkDeleteUsers() {
    if (this.selectedUsers.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${this.selectedUsers.length} user(s)? This action cannot be undone.`)) {
      // Implement bulk delete - this would typically be a backend API call
      alert('Bulk delete functionality would be implemented here.');
      // this.userService.bulkDeleteUsers(this.selectedUsers.map(u => u.id)).subscribe(...)
    }
  }
}

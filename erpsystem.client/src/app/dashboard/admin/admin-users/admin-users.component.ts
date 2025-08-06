import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Search, UserPlus, CheckSquare, Square, X } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { User, UserSearchRequest, PagedResult, Result } from '../../../core/models/user.interface';
import {
  CustomTableComponent,
  TableConfig,
  TableSortEvent,
  TablePageEvent,
  TableSelectionEvent,
  BulkActionsComponent,
  BulkAction,
  BulkActionConfirmation,
  ConfirmationModalComponent,
  ConfirmationConfig,
  UserTableService
} from '../../../shared';
import { UpdateUserModalComponent } from './update-user-modal/update-user-modal.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CustomTableComponent, BulkActionsComponent, ConfirmationModalComponent, UpdateUserModalComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  @ViewChild(CustomTableComponent) tableComponent!: CustomTableComponent<User>;

  readonly icons = {
    Search,
    UserPlus,
    CheckSquare,
    Square,
    X
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
  tableConfig: TableConfig<User>;

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  // Sorting state
  sortBy = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Multi-select and bulk actions
  selectedUsers: User[] = [];
  selectedCount = 0;

  // Update user modal
  showUpdateModal = false;
  selectedUserId = '';

  // Confirmation modal
  showConfirmationModal = false;
  confirmationConfig: ConfirmationConfig = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?'
  };
  pendingAction: { actionId: string; users: User[]; activate?: boolean } | null = null;

  // Debouncing for search and filters
  private searchSubject = new Subject<string>();
  private filterSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private router: Router,
    private userTableService: UserTableService
  ) {
    // Initialize table config with empty data
    this.tableConfig = this.userTableService.createUserTableConfig(
      [],
      0,
      this.currentPage,
      this.pageSize,
      true,
      null,
      (user: User) => this.editUser(user),
      (user: User) => this.toggleUserStatus(user),
      true
    );
  }

  ngOnInit() {
    // Setup debounced search with reasonable delay to prevent excessive API calls
    this.searchSubject
      .pipe(
        debounceTime(800), // 800ms delay - user must pause typing for search to trigger
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchRequest.searchTerm = searchTerm;
        this.currentPage = 1; // Reset to first page on search
        this.loadUsers();
      });

    // Setup debounced filter changes
    this.filterSubject
      .pipe(
        debounceTime(200), // Shorter delay for filter dropdown changes
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1; // Reset to first page on filter change
        this.loadUsers();
      });

    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers() {
    this.loading = true;
    this.error = null;

    // Update search request with current pagination and sorting
    this.searchRequest.page = this.currentPage;
    this.searchRequest.pageSize = this.pageSize;

    // Update table config immediately to show loading state
    this.updateTableConfig();

    this.userService.getUsers(this.searchRequest).subscribe({
      next: (result: Result<PagedResult<User>>) => {
        this.loading = false;
        if (result.isSuccess && result.data) {
          this.pagedResult = result.data;
          this.users = result.data.items;
          this.totalItems = result.data.totalCount;
          this.updateTableConfig();
        } else {
          this.error = result.message || result.error || 'Failed to load users';
          this.updateTableConfig();
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to load users: ' + (error.error?.message || error.message);
        this.updateTableConfig();
      }
    });
  }

  private updateTableConfig() {
    this.tableConfig = this.userTableService.createUserTableConfig(
      this.users,
      this.totalItems,
      this.currentPage,
      this.pageSize,
      this.loading,
      this.error,
      (user: User) => this.editUser(user),
      (user: User) => this.toggleUserStatus(user),
      true
    );

    // Apply current sorting
    if (this.sortBy) {
      this.tableConfig.sortBy = this.sortBy;
      this.tableConfig.sortDirection = this.sortDirection;
    }
  }

  // Table event handlers
  onSortChanged(event: TableSortEvent) {
    this.sortBy = event.sortBy;
    this.sortDirection = event.sortDirection;
    this.currentPage = 1; // Reset to first page on sort change
    this.loadUsers();
  }

  onPageChanged(event: TablePageEvent) {
    this.currentPage = event.currentPage;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  onSelectionChanged(event: TableSelectionEvent<User>) {
    this.selectedUsers = event.selectedRows;
    this.selectedCount = event.selectedCount;
  }

  onRowClicked(user: User) {
    // Optional: Handle row click
    console.log('Row clicked:', user);
  }

  // Search and filter methods
  onSearch() {
    // Immediate search when Enter key is pressed
    this.loadUsers();
  }

  onSearchChange(searchTerm: string) {
    // Debounced search for input changes
    this.searchSubject.next(searchTerm);
  }

  onFilterChange() {
    // Debounced filter change
    this.filterSubject.next();
  }

  clearSearch() {
    this.searchRequest.searchTerm = '';
    this.loadUsers();
  }

  navigateToRegister() {
    this.router.navigate(['/dashboard/admin/register']);
  }

  editUser(user: User) {
    this.selectedUserId = user.id;
    this.showUpdateModal = true;
  }

  onUserUpdated(updatedUser: User) {
    // Update the user in the current list
    const index = this.users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      this.users[index] = { ...updatedUser, isActive: updatedUser.status === "ACTIVE" };
      this.updateTableConfig();
    }
    this.showUpdateModal = false;
  }

  onActionClicked(event: { action: any, row: User }) {
    const { action, row: user } = event;
    
    // Call the action function directly
    if (action.action && typeof action.action === 'function') {
      action.action(user);
    } else {
      console.warn('Action function not found:', action);
    }
  }

  onUpdateModalCancelled() {
    this.showUpdateModal = false;
    this.selectedUserId = '';
  }

  showIndividualActionConfirmation(action: string, user: User, callback: () => void) {
    const actionMessages = {
      activate: {
        title: 'Confirm User Activation',
        message: `Are you sure you want to activate the user "${user.firstName} ${user.lastName}"?`,
        confirmText: 'Activate User',
        type: 'success' as const
      },
      deactivate: {
        title: 'Confirm User Deactivation',
        message: `Are you sure you want to deactivate the user "${user.firstName} ${user.lastName}"?\n\nThis will prevent them from accessing the system.`,
        confirmText: 'Deactivate User',
        type: 'warning' as const
      }
    };

    const config = actionMessages[action as keyof typeof actionMessages];
    if (config) {
      this.showConfirmationDialog({
        title: config.title,
        message: config.message,
        confirmText: config.confirmText,
        type: config.type,
        details: [`${user.firstName} ${user.lastName}`, user.email]
      }, callback);
    } else {
      // Fallback to direct execution if no confirmation config found
      callback();
    }
  }

  toggleUserStatus(user: User) {
    this.loading = true;
    // Update table config immediately to show loading state
    this.updateTableConfig();

    const action = user.isActive ?
      this.userService.deactivateUser(user.id) :
      this.userService.activateUser(user.id);

    action.subscribe({
      next: (result) => {
        this.loading = false;
        if (result.isSuccess) {
          this.loadUsers(); // Refresh the list
        } else {
          this.error = result.message || result.error || 'Failed to update user status';
          this.updateTableConfig();
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to update user status: ' + (error.error?.message || error.message);
        this.updateTableConfig();
      }
    });
  }

  onClearSelection() {
    this.selectedUsers = [];
    this.selectedCount = 0;
    // Clear selection in table component if needed
    if (this.tableComponent) {
      // Custom table component should handle clearing its own selection
      this.tableComponent.internalSelectedRows = [];
    }
  }

  // Bulk actions
  onBulkAction(event: { actionId: string; confirmation?: BulkActionConfirmation }) {
    const { actionId, confirmation } = event;

    switch (actionId) {
      case 'activate':
        this.handleActivateAction(confirmation);
        break;
      case 'deactivate':
        this.handleDeactivateAction(confirmation);
        break;
      case 'export':
        this.exportSelectedUsers();
        break;
      case 'delete':
        this.handleDeleteAction(confirmation);
        break;
    }
  }

  private handleActivateAction(confirmation?: BulkActionConfirmation) {
    if (this.selectedUsers.length === 0) return;

    const inactiveUsers = this.selectedUsers.filter(user => !user.isActive);
    if (inactiveUsers.length === 0) {
      // Simple alert for non-critical info
      alert('Selected users are already active.');
      return;
    }

    if (confirmation?.requiresConfirmation) {
      this.showConfirmationDialog({
        title: confirmation.title,
        message: `${confirmation.message}\n\n${inactiveUsers.length} user(s) will be activated.`,
        confirmText: confirmation.confirmText,
        type: confirmation.type,
        details: inactiveUsers.map(u => `${u.firstName} ${u.lastName} (${u.email})`)
      }, () => {
        this.processBulkStatusChange(inactiveUsers, true);
      });
    } else {
      this.processBulkStatusChange(inactiveUsers, true);
    }
  }

  private handleDeactivateAction(confirmation?: BulkActionConfirmation) {
    if (this.selectedUsers.length === 0) return;

    const activeUsers = this.selectedUsers.filter(user => user.isActive);
    if (activeUsers.length === 0) {
      // Simple alert for non-critical info
      alert('Selected users are already inactive.');
      return;
    }

    if (confirmation?.requiresConfirmation) {
      this.showConfirmationDialog({
        title: confirmation.title,
        message: `${confirmation.message}\n\n${activeUsers.length} user(s) will be deactivated.`,
        confirmText: confirmation.confirmText,
        type: confirmation.type,
        details: activeUsers.map(u => `${u.firstName} ${u.lastName} (${u.email})`)
      }, () => {
        this.processBulkStatusChange(activeUsers, false);
      });
    } else {
      this.processBulkStatusChange(activeUsers, false);
    }
  }

  private handleDeleteAction(confirmation?: BulkActionConfirmation) {
    if (this.selectedUsers.length === 0) return;

    if (confirmation?.requiresConfirmation) {
      this.showConfirmationDialog({
        title: confirmation.title,
        message: `${confirmation.message}\n\n${this.selectedUsers.length} user(s) will be deleted.`,
        confirmText: confirmation.confirmText,
        type: confirmation.type,
        details: this.selectedUsers.map(u => `${u.firstName} ${u.lastName} (${u.email})`)
      }, () => {
        this.bulkDeleteUsers();
      });
    } else {
      this.bulkDeleteUsers();
    }
  }

  // Confirmation modal helpers
  private showConfirmationDialog(config: ConfirmationConfig, onConfirm: () => void) {
    this.confirmationConfig = config;
    this.pendingAction = { actionId: 'custom', users: this.selectedUsers };
    this.showConfirmationModal = true;

    // Store the callback for when user confirms
    (this as any).pendingConfirmCallback = onConfirm;
  }

  onConfirmationConfirmed() {
    if ((this as any).pendingConfirmCallback) {
      (this as any).pendingConfirmCallback();
      (this as any).pendingConfirmCallback = null;
    }
    this.pendingAction = null;
  }

  onConfirmationCancelled() {
    this.pendingAction = null;
    (this as any).pendingConfirmCallback = null;
  }

  private processBulkStatusChange(users: User[], activate: boolean) {
    this.loading = true;
    // Update table config immediately to show loading state
    this.updateTableConfig();

    const userIds = users.map(user => user.id);

    const action = activate ?
      this.userService.bulkActivateUsers(userIds) :
      this.userService.bulkDeactivateUsers(userIds);

    action.subscribe({
      next: (result) => {
        this.loading = false;
        if (result.isSuccess) {
          const actionType = activate ? 'activated' : 'deactivated';
          const successCount = result.data?.length || 0;

          if (successCount === users.length) {
            // All succeeded
            this.showSuccessMessage(`Successfully ${actionType} ${successCount} user(s)!`);
          } else {
            // Partial success
            const failedCount = users.length - successCount;
            this.showWarningMessage(`Bulk operation completed with partial success:\n${successCount} user(s) ${actionType} successfully\n${failedCount} user(s) failed`);
          }
        } else {
          // All failed
          this.error = result.message || result.error || `Failed to ${activate ? 'activate' : 'deactivate'} users`;
          this.showErrorMessage(`Bulk operation failed: ${this.error}`);
        }

        this.loadUsers(); // Refresh the list
        this.onClearSelection(); // Clear selection
      },
      error: (error) => {
        this.loading = false;
        this.error = `Failed to ${activate ? 'activate' : 'deactivate'} users: ` + (error.error?.message || error.message);
        this.showErrorMessage(`Bulk operation failed: ${this.error}`);

        this.loadUsers(); // Refresh the list
        this.onClearSelection(); // Clear selection
      }
    });
  }

  // User feedback methods
  private showSuccessMessage(message: string) {
    this.showConfirmationDialog({
      title: 'Success',
      message,
      confirmText: 'OK',
      type: 'success'
    }, () => { });
  }

  private showWarningMessage(message: string) {
    this.showConfirmationDialog({
      title: 'Warning',
      message,
      confirmText: 'OK',
      type: 'warning'
    }, () => { });
  }

  private showErrorMessage(message: string) {
    this.showConfirmationDialog({
      title: 'Error',
      message,
      confirmText: 'OK',
      type: 'danger'
    }, () => { });
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

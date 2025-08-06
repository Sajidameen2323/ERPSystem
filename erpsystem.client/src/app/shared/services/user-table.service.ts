import { Injectable } from '@angular/core';
import { TableConfig, TableColumn, TableAction } from '../components/custom-table/custom-table.component';
import { User } from '../../core/models/user.interface';
import { Edit, UserX, UserCheck } from 'lucide-angular';

@Injectable({
  providedIn: 'root'
})
export class UserTableService {

  createUserTableConfig(
    users: User[],
    totalItems?: number,
    currentPage: number = 1,
    pageSize: number = 10,
    loading: boolean = false,
    error: string | null = null,
    onEdit?: (user: User) => void,
    onToggleStatus?: (user: User) => void,
    enableMultiSelect: boolean = true
  ): TableConfig<User> {

    const columns: TableColumn<User>[] = [
      {
        key: 'firstName',
        header: 'User',
        sortable: true,
        sortKey: 'firstName',
        width: '35%',
        minWidth: '250px',
        cellRenderer: (value, row) => this.renderUserInfo(row)
      },
      {
        key: 'isActive',
        header: 'Status',
        sortable: true,
        sortKey: 'isActive',
        width: '15%',
        align: 'center',
        cellRenderer: (value, row) => this.renderStatus(row)
      },
      {
        key: 'roles',
        header: 'Roles',
        sortable: false,
        width: '25%',
        cellRenderer: (value, row) => this.renderRoles(row.roles)
      },
      {
        key: 'created',
        header: 'Created',
        sortable: true,
        sortKey: 'created',
        width: '20%',
        cellRenderer: (value, row) => this.renderDate(row.created)
      }
    ];

    const actions: TableAction<User>[] = [];
    
    if (onEdit) {
      actions.push({
        label: 'Edit',
        icon: Edit,
        action: onEdit,
        class: 'edit-action'
      });
    }

    if (onToggleStatus) {
      actions.push({
        label: 'Toggle Status',
        icon: UserCheck,
        action: onToggleStatus,
        class: 'toggle-action',
        visible: (user) => true // Always visible, icon changes based on status
      });
    }

    return {
      columns,
      data: users,
      loading,
      error,
      pagination: true,
      pageSize,
      currentPage,
      totalItems: totalItems || users.length,
      pageSizeOptions: [5, 10, 25, 50, 100],
      selectable: true,
      multiSelect: enableMultiSelect,
      rowIdKey: 'id',
      sortable: true,
      emptyMessage: 'No users found',
      actions,
      rowClass: (row, index) => {
        // Add any custom row styling here
        return '';
      }
    };
  }

  private renderUserInfo(user: User): string {
    const displayName = user.displayName || `${user.firstName} ${user.lastName}`;
    return `
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0 h-10 w-10">
          <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <svg class="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
        </div>
        <div class="flex flex-col">
          <div class="text-sm font-medium text-gray-900 dark:text-white">
            ${this.escapeHtml(displayName)}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            ${this.escapeHtml(user.email)}
          </div>
        </div>
      </div>
    `;
  }

  private renderStatus(user: User): string {
    const isActive = user.isActive;
    const statusText = isActive ? 'Active' : 'Inactive';
    const statusClasses = isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    
    const iconSvg = isActive 
      ? '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
      : '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

    return `
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses}">
        ${iconSvg}
        ${statusText}
      </span>
    `;
  }

  private renderRoles(roles: string[] | null | undefined): string {
    if (!roles || roles.length === 0) {
      return '<span class="text-sm text-gray-500 dark:text-gray-400 italic">No roles assigned</span>';
    }

    const roleSpans = roles.map(role => 
      `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
        ${this.escapeHtml(role)}
      </span>`
    ).join(' ');

    return `<div class="flex flex-wrap gap-1">${roleSpans}</div>`;
  }

  private renderDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return '<span class="text-sm text-gray-500 dark:text-gray-400">N/A</span>';
    }

    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <div class="text-sm">
          <div class="text-gray-900 dark:text-white">${formattedDate}</div>
          <div class="text-gray-500 dark:text-gray-400 text-xs">${formattedTime}</div>
        </div>
      `;
    } catch {
      return '<span class="text-sm text-gray-500 dark:text-gray-400">Invalid Date</span>';
    }
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

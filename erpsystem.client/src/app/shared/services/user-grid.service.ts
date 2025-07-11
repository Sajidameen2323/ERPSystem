import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { AgGridConfig } from '../components/ag-grid-table/ag-grid-table.component';
import { User } from '../../core/models/user.interface';
import { UserInfoCellRendererComponent } from '../components/ag-grid-renderers/user-info-cell-renderer/user-info-cell-renderer.component';
import { StatusCellRendererComponent } from '../components/ag-grid-renderers/status-cell-renderer/status-cell-renderer.component';
import { RolesCellRendererComponent } from '../components/ag-grid-renderers/roles-cell-renderer/roles-cell-renderer.component';
import { ActionCellRendererComponent } from '../components/ag-grid-renderers/action-cell-renderer/action-cell-renderer.component';

@Injectable({
  providedIn: 'root'
})
export class UserGridService {

  createUserGridConfig(
    users: User[], 
    loading: boolean = false, 
    error: string | null = null,
    onEdit?: (user: User) => void,
    onToggleStatus?: (user: User) => void,
    enableMultiSelect: boolean = false,
    onConfirmAction?: (action: string, user: User, callback: () => void) => void
  ): AgGridConfig<User> {
    
    const columnDefs: ColDef[] = [
      {
        headerName: 'User',
        field: 'firstName',
        cellRenderer: UserInfoCellRendererComponent,
        sortable: true,
        flex: 2,
        minWidth: 250,
        resizable: true,
        cellStyle: { 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '8px 12px'
        },
        valueFormatter: (params) => {
          // Provide a fallback value formatter for the user cell renderer
          if (!params.value) return '';
          return `${params.data?.firstName || ''} ${params.data?.lastName || ''}`.trim();
        }
      },
      {
        headerName: 'Status',
        field: 'isActive',
        cellRenderer: StatusCellRendererComponent,
        sortable: true,
        flex: 1,
        minWidth: 120,
        resizable: true,
        cellStyle: { 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '8px 12px'
        },
        valueFormatter: (params) => {
          // Provide a fallback value formatter for the status cell renderer
          return params.value ? 'Active' : 'Inactive';
        }
      },
      {
        headerName: 'Roles',
        field: 'roles',
        cellRenderer: RolesCellRendererComponent,
        sortable: true,
        flex: 1.5,
        minWidth: 150,
        resizable: true,
        cellStyle: { 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '8px 12px'
        },
        // Use field value directly for filtering - AG Grid will extract from the field
        valueGetter: (params) => {
          // Return flat array of role strings for AG Grid filtering
          if (!params.data?.roles) return [];
          if (Array.isArray(params.data.roles)) {
            return params.data.roles.map((role: any) => {
              if (typeof role === 'string') {
                return role.toLowerCase();
              }
              return (role.name || role.displayName || '').toLowerCase();
            });
          }
          if (typeof params.data.roles === 'string') {
            return [params.data.roles.toLowerCase()];
          }
          return [];
        },
        valueFormatter: (params) => {
          // Handle array/object data type for roles display
          if (!params.data?.roles) return '';
          if (Array.isArray(params.data.roles)) {
            return params.data.roles.map((role: any) => 
              typeof role === 'string' ? role : 
              role.name || role.displayName || ''
            ).join(', ');
          }
          if (typeof params.data.roles === 'object') {
            return params.data.roles.name || params.data.roles.displayName || JSON.stringify(params.data.roles);
          }
          return params.data.roles.toString();
        }
      },
      {
        headerName: 'Last Login',
        field: 'lastLoginAt',
        sortable: true,
        flex: 1,
        minWidth: 150,
        resizable: true,
        cellStyle: { 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '8px 12px'
        },
        valueFormatter: (params) => {
          if (!params.value) return '-';
          return new Date(params.value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      },
      {
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: ActionCellRendererComponent,
        cellRendererParams: {
          onEdit: onEdit,
          onToggleStatus: onConfirmAction ? 
            (user: User) => {
              const action = user.isActive ? 'deactivate' : 'activate';
              onConfirmAction(action, user, () => onToggleStatus?.(user));
            } : 
            onToggleStatus,
          showEdit: true,
          showToggleStatus: true
        },
        sortable: false,
        flex: 1,
        minWidth: 120,
        resizable: false,
        pinned: 'right',
        cellStyle: { 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 12px'
        },
        valueFormatter: (params) => {
          // Actions column doesn't need to display text, just return empty string
          return '';
        }
      }
    ];

    return {
      columnDefs,
      rowData: users,
      loading,
      error,
      pagination: true,
      paginationPageSize: 20,
      rowSelection: enableMultiSelect ? {
        mode: 'multiRow',
        enableClickSelection: false, // Only allow checkbox selection
        checkboxes: true, // Enable checkboxes
        headerCheckbox: true // Enable header checkbox for select all
      } : 'single',
      animateRows: false, // Disable animations for professional look
      enableSorting: true,
      enableColResize: true,
      suppressMovableColumns: true,
      headerHeight: 48,
      rowHeight: 52, // Compact professional height
      domLayout: 'normal', // Use normal layout for proper overlay display
      gridHeight: 600, // Fixed height for proper overlay display
      overlayNoRowsTemplate: `
        <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No users found</h3>
          <p class="text-gray-500 dark:text-gray-400 max-w-sm">Try adjusting your search criteria or filters to find what you're looking for.</p>
        </div>
      `,
      overlayLoadingTemplate: `
        <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div class="w-16 h-16 mb-4 relative">
            <div class="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Loading users...</h3>
          <p class="text-gray-500 dark:text-gray-400">Please wait while we fetch the latest data.</p>
        </div>
      `,
      getRowClass: (params) => {
        return params.node.rowIndex! % 2 === 0 ? 'ag-row-even' : 'ag-row-odd';
      }
    };
  }

  // Method to create a generic grid configuration
  createGenericGridConfig<T>(
    data: T[],
    columnDefs: ColDef[],
    options?: Partial<AgGridConfig<T>>
  ): AgGridConfig<T> {
    return {
      columnDefs,
      rowData: data,
      pagination: true,
      paginationPageSize: 20,
      rowSelection: 'single',
      animateRows: false, // Disable animations for professional look
      enableSorting: true,
      enableColResize: true,
      suppressMovableColumns: true,
      headerHeight: 48,
      rowHeight: 60,
      domLayout: 'normal', // Use normal layout for proper overlay display
      overlayNoRowsTemplate: `
        <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No data available</h3>
          <p class="text-gray-500 dark:text-gray-400 max-w-sm">There is currently no data to display.</p>
        </div>
      `,
      overlayLoadingTemplate: `
        <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div class="w-16 h-16 mb-4 relative">
            <div class="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Loading...</h3>
          <p class="text-gray-500 dark:text-gray-400">Please wait while we fetch the data.</p>
        </div>
      `,
      ...options
    };
  }
}

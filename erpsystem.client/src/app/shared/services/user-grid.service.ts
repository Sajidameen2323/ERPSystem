import { Injectable } from '@angular/core';
import { ColDef, ISetFilterParams } from 'ag-grid-community';
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
    enableMultiSelect: boolean = false
  ): AgGridConfig<User> {
    
    const columnDefs: ColDef[] = [
      {
        headerName: 'User',
        field: 'firstName',
        cellRenderer: UserInfoCellRendererComponent,
        sortable: true,
        filter: true,
        flex: 2,
        minWidth: 250,
        resizable: true,
        // checkboxSelection: (params) => !!enableMultiSelect && params.node?.rowIndex != null, // Only show on data rows
        // headerCheckboxSelection: !!enableMultiSelect,
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
        filter: true,
        flex: 1,
        minWidth: 120,
        resizable: true,
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
        filter: 'agSetColumnFilter',
        filterParams: {
          values: ['admin', 'inventoryuser', 'salesuser'], // Role filter options
          suppressSelectAll: false,
          suppressMiniFilter: false,
          newRowsAction: 'keep',
          caseSensitive: false
        } as ISetFilterParams,
        flex: 1.5,
        minWidth: 150,
        resizable: true,
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
        filter: true,
        flex: 1,
        minWidth: 150,
        resizable: true,
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
          onToggleStatus: onToggleStatus,
          showEdit: true,
          showToggleStatus: true
        },
        sortable: false,
        filter: false,
        flex: 1,
        minWidth: 120,
        resizable: false,
        pinned: 'right',
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
      rowSelection: enableMultiSelect ? 'multiple' : 'single',
      animateRows: false, // Disable animations for professional look
      enableSorting: true,
      enableFilter: true,
      enableColResize: true,
      suppressMovableColumns: true,
      headerHeight: 48,
      rowHeight: 52, // Compact professional height
      domLayout: 'autoHeight',
      overlayNoRowsTemplate: '<div class="text-center py-8"><div class="text-gray-500 dark:text-gray-400">No users found</div></div>',
      overlayLoadingTemplate: '<div class="text-center py-8"><div class="text-gray-500 dark:text-gray-400">Loading users...</div></div>',
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
      enableFilter: true,
      enableColResize: true,
      suppressMovableColumns: true,
      headerHeight: 48,
      rowHeight: 60,
      domLayout: 'autoHeight',
      overlayNoRowsTemplate: '<div class="text-center py-8"><div class="text-gray-500 dark:text-gray-400">No data available</div></div>',
      overlayLoadingTemplate: '<div class="text-center py-8"><div class="text-gray-500 dark:text-gray-400">Loading...</div></div>',
      ...options
    };
  }
}

// AG Grid Community v34.0.1 - Working Example
// This example demonstrates how to use the updated ag-grid-table component

import { AgGridConfig, AgGridTableComponent } from './src/app/shared/components/ag-grid-table/ag-grid-table.component';

// Example 1: Basic usage with no filters (safe for Community)
export const basicGridConfig: AgGridConfig = {
  columnDefs: [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Name', width: 150, sortable: true },
    { field: 'email', headerName: 'Email', width: 200, sortable: true },
    { field: 'status', headerName: 'Status', width: 120, sortable: true }
  ],
  rowData: [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' }
  ],
  pagination: true,
  paginationPageSize: 10,
  loading: false,
  error: null
};

// Example 2: Using helper method to create safe column definitions
export const helperBasedConfig: AgGridConfig = {
  columnDefs: AgGridTableComponent.createSafeColumnDefs([
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Name', width: 150, sortable: true },
    { field: 'email', headerName: 'Email', width: 200, sortable: true },
    { field: 'status', headerName: 'Status', width: 120, sortable: true }
  ]),
  rowData: [],
  pagination: true,
  paginationPageSize: 20
};

// Example 3: Modern row selection configuration (v34+ API)
export const rowSelectionConfig: AgGridConfig = {
  columnDefs: [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'department', headerName: 'Department', width: 150 }
  ],
  rowData: [
    { id: 1, name: 'Alice', department: 'Engineering' },
    { id: 2, name: 'Bob', department: 'Marketing' },
    { id: 3, name: 'Charlie', department: 'Sales' }
  ],
  rowSelection: {
    mode: 'multiRow',
    enableClickSelection: true,
    checkboxes: false,
    headerCheckbox: false
  },
  pagination: true
};

/* 
Template Usage:
<app-ag-grid-table 
  [config]="basicGridConfig"
  (rowSelectionChanged)="onRowSelection($event)"
  (cellClicked)="onCellClicked($event)">
</app-ag-grid-table>
*/

/*
Key Changes Made to Resolve "No AG Grid modules are registered!" Error:

1. ✅ Imported AllCommunityModule and ModuleRegistry separately for clarity
2. ✅ Registered AllCommunityModule using ModuleRegistry.registerModules([AllCommunityModule])
3. ✅ Completely removed ALL filter functionality and references
4. ✅ Updated sanitizeColumnDefsForCommunity to strip any filter configurations
5. ✅ Updated helper methods to never add filters
6. ✅ Removed enableFilter from AgGridConfig interface
7. ✅ Used only Community features in grid configuration
8. ✅ Modern v34+ row selection API implementation

Features Available in Community (NO FILTERS):
- ✅ Sorting
- ✅ Pagination
- ✅ Row Selection (single/multi)
- ✅ Column Resizing
- ✅ Basic Cell Renderers
- ✅ Themes (themeQuartz)
- ✅ Virtual Scrolling
- ✅ Auto Height

Features NOT Available (Enterprise Only):
- ❌ ALL FILTERS (Set Filter, Multi Filter, Text Filter, Number Filter, Date Filter)
- ❌ Row Grouping
- ❌ Pivoting
- ❌ Advanced Charts
- ❌ Excel Export (advanced)
- ❌ Server-side Row Model (advanced features)

IMPORTANT: This component is now 100% filter-free to ensure compatibility with AG Grid Community v34.0.1
*/

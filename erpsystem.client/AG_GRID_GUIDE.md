# AG Grid Implementation Guide

This guide explains how to use the generalized AG Grid implementation in the ERP System.

## Overview

The AG Grid implementation provides a customizable, feature-rich data table component with Tailwind CSS styling and dark mode support.

## Installation

AG Grid modules are automatically registered when importing the AgGridTableComponent. The following modules are included:

```typescript
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
```

## Components

### 1. AgGridTableComponent

The main wrapper component that handles AG Grid configuration and rendering.

```typescript
import { AgGridTableComponent, AgGridConfig } from './shared';

// In your component
export class MyComponent {
  gridConfig: AgGridConfig<MyDataType>;
  
  ngOnInit() {
    this.gridConfig = {
      columnDefs: [...],
      rowData: [...],
      // ... other options
    };
  }
}
```

```html
<app-ag-grid-table [config]="gridConfig"></app-ag-grid-table>
```

### 2. Cell Renderers

Pre-built cell renderers for common use cases:

- **ActionCellRendererComponent**: Renders action buttons (edit, delete, etc.)
- **StatusCellRendererComponent**: Renders status badges with icons
- **UserInfoCellRendererComponent**: Renders user information with avatar
- **RolesCellRendererComponent**: Renders role badges

### 3. UserGridService

Service that provides pre-configured grid setups for common scenarios:

```typescript
// For user tables
const userGridConfig = this.userGridService.createUserGridConfig(
  users,
  loading,
  error,
  (user) => this.editUser(user),
  (user) => this.toggleUserStatus(user)
);

// For generic tables
const genericGridConfig = this.userGridService.createGenericGridConfig(
  data,
  columnDefs,
  options
);
```

## Usage Examples

### Basic Table

```typescript
export class MyTableComponent implements OnInit {
  gridConfig: AgGridConfig<MyData>;
  data: MyData[] = [];

  ngOnInit() {
    this.gridConfig = {
      columnDefs: [
        { headerName: 'Name', field: 'name', sortable: true, filter: true },
        { headerName: 'Email', field: 'email', sortable: true, filter: true },
        { headerName: 'Status', field: 'status', cellRenderer: StatusCellRendererComponent }
      ],
      rowData: this.data,
      pagination: true,
      paginationPageSize: 10
    };
  }
}
```

### Table with Custom Actions

```typescript
const columnDefs: ColDef[] = [
  // ... other columns
  {
    headerName: 'Actions',
    field: 'actions',
    cellRenderer: ActionCellRendererComponent,
    cellRendererParams: {
      onEdit: (data) => this.editItem(data),
      onDelete: (data) => this.deleteItem(data),
      showEdit: true,
      showDelete: true
    },
    sortable: false,
    filter: false,
    pinned: 'right'
  }
];
```

### Custom Cell Renderer

```typescript
@Component({
  selector: 'app-custom-cell-renderer',
  standalone: true,
  template: `<div>{{ customValue }}</div>`
})
export class CustomCellRendererComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  customValue!: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.customValue = this.processValue(params.value);
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.customValue = this.processValue(params.value);
    return true;
  }

  private processValue(value: any): string {
    // Custom processing logic
    return value?.toString() || '';
  }
}
```

## Features

- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Automatically adapts to light/dark themes
- **Tailwind Integration**: Styled with Tailwind CSS classes
- **Custom Cell Renderers**: Pre-built and extensible cell renderers
- **Pagination**: Built-in pagination support
- **Sorting & Filtering**: Column sorting and filtering
- **Row Selection**: Single and multiple row selection
- **Loading States**: Loading and error state handling
- **Export**: CSV export functionality

## Styling

The AG Grid is styled with a custom theme that integrates with Tailwind CSS:

- Uses CSS custom properties for theming
- Supports light and dark modes
- Consistent with the application's design system
- Responsive and accessible

## Configuration Options

### AgGridConfig Interface

```typescript
interface AgGridConfig<T = any> {
  columnDefs: ColDef[];
  rowData: T[];
  loading?: boolean;
  error?: string | null;
  pagination?: boolean;
  paginationPageSize?: number;
  rowSelection?: 'single' | 'multiple';
  suppressRowClickSelection?: boolean;
  animateRows?: boolean;
  enableSorting?: boolean;
  enableFilter?: boolean;
  enableColResize?: boolean;
  suppressMovableColumns?: boolean;
  headerHeight?: number;
  rowHeight?: number;
  domLayout?: 'normal' | 'autoHeight' | 'print';
  overlayNoRowsTemplate?: string;
  overlayLoadingTemplate?: string;
  getRowClass?: (params: any) => string | string[];
  onRowClicked?: (event: any) => void;
  onCellClicked?: (event: CellClickedEvent) => void;
  onSelectionChanged?: (event: SelectionChangedEvent) => void;
  customCssClass?: string;
}
```

## Best Practices

1. **Performance**: Use pagination for large datasets
2. **Accessibility**: Ensure proper ARIA labels and keyboard navigation
3. **Responsive**: Test on different screen sizes
4. **Error Handling**: Always handle loading and error states
5. **User Experience**: Provide clear feedback for actions

## Example Implementation

See `admin-users.component.ts` for a complete implementation example of AG Grid with:
- Custom cell renderers
- Action handling
- Search and filtering
- Error handling
- Loading states

The implementation replaces the traditional HTML table with a modern, feature-rich AG Grid solution.

## Modern AG Grid Theming API - Professional Design

This implementation uses AG Grid's new Theming API with a sleek, industry-standard design:

- **Professional Blue Color Scheme**: Uses blue accent color (#2563eb) for a corporate look
- **Clean Typography**: System fonts with optimal sizing for readability
- **No Animations**: Disabled for professional, fast performance
- **Compact Layout**: 52px row height for efficient data display
- **Sharp Corners**: Clean lines without rounded borders
- **Minimal CSS**: Reduced custom styling, relies on AG Grid's theming API

### Theme Configuration

The component uses a professional color palette:

```typescript
// Professional theming configuration
public get themeConfig() {
  const isDarkMode = this.config?.darkMode || document.documentElement.classList.contains('dark');
  
  return themeQuartz.withParams({
    spacing: 8, // Compact spacing
    accentColor: '#2563eb', // Professional blue
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
    foregroundColor: isDarkMode ? '#e5e7eb' : '#374151',
    headerBackgroundColor: isDarkMode ? '#374151' : '#f8fafc',
    headerFontSize: 13,
    headerFontWeight: 600,
    rowHeight: 52, // Compact professional height
    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
    borderRadius: 0, // Sharp corners for professional look
    selectedRowBackgroundColor: isDarkMode ? '#1e40af' : '#dbeafe',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 13,
    checkboxCheckedShapeColor: '#2563eb',
  });
}
```

### Resolved Issues

The following AG Grid deprecation warnings and errors have been resolved:

1. **Legacy Theme Conflict**: Removed `ag-grid.css` imports to prevent conflicts with theming API
2. **Deprecated rowSelection**: Updated from string values to object configuration:
   ```typescript
   // Old (deprecated)
   rowSelection: 'single'
   
   // New (modern)
   rowSelection: { mode: 'singleRow', enableClickSelection: true }
   ```
3. **Deprecated Loading Overlay**: Updated from `api.showLoadingOverlay()` to grid option:
   ```typescript
   // Old (deprecated)
   this.gridApi.showLoadingOverlay();
   
   // New (modern)
   this.gridApi.setGridOption('loading', true);
   ```
4. **Pagination Page Size**: Fixed page size selector to include valid options
5. **Object Value Formatting**: Added value formatters for object data types:
   ```typescript
   // Example: Handling array/object data in roles column
   {
     headerName: 'Roles',
     field: 'roles',
     cellRenderer: RolesCellRendererComponent,
     valueFormatter: (params) => {
       if (!params.value) return '';
       if (Array.isArray(params.value)) {
         return params.value.map(role => 
           typeof role === 'string' ? role : role.name || role.displayName || ''
         ).join(', ');
       }
       if (typeof params.value === 'object') {
         return params.value.name || params.value.displayName || JSON.stringify(params.value);
       }
       return params.value.toString();
     }
   }
   ```

## Handling Object Data Types

When using AG Grid with object data types (arrays, nested objects), always provide value formatters to prevent errors:

### Common Object Data Types

1. **Arrays (like roles, tags, categories)**:
   ```typescript
   {
     field: 'roles',
     cellRenderer: CustomArrayRenderer,
     valueFormatter: (params) => {
       if (!params.value || !Array.isArray(params.value)) return '';
       return params.value.map(item => 
         typeof item === 'string' ? item : item.name || item.displayName || ''
       ).join(', ');
     }
   }
   ```

2. **Nested Objects (like user profiles, addresses)**:
   ```typescript
   {
     field: 'profile',
     cellRenderer: ProfileRenderer,
     valueFormatter: (params) => {
       if (!params.value || typeof params.value !== 'object') return '';
       return params.value.displayName || params.value.name || JSON.stringify(params.value);
     }
   }
   ```

3. **Action Columns (no data display needed)**:
   ```typescript
   {
     field: 'actions',
     cellRenderer: ActionCellRenderer,
     valueFormatter: () => '', // Always return empty string for action columns
     sortable: false,
     filter: false
   }
   ```

### Best Practices

- Always include `valueFormatter` for columns with object data
- Provide meaningful fallbacks for null/undefined values
- Use `JSON.stringify()` as a last resort for complex objects
- Consider the performance impact of complex formatters on large datasets
- Test with real data to ensure formatters handle edge cases

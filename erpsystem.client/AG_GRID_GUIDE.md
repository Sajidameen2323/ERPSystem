# AG Grid Implementation Guide - Community v34.0.1

This guide explains how to quickly set up and configure AG Grid tables in the ERP System using AG Grid Community v34.0.1 with modern APIs.

⚠️ **Important**: This implementation uses AG Grid Community which does NOT support filters. All examples are filter-free for full compatibility.

## Quick Start

### 1. Import Required Components

```typescript
import { AgGridTableComponent, AgGridConfig } from '../../shared';
```

### 2. Add to Component Template

```html
<app-ag-grid-table 
  [config]="gridConfig"
  (selectedRowsChanged)="onSelectionChanged($event)">
</app-ag-grid-table>
```

### 3. Basic Configuration

```typescript
export class MyComponent implements OnInit {
  gridConfig: AgGridConfig<MyDataType>;
  data: MyDataType[] = [];

  ngOnInit() {
    this.gridConfig = {
      columnDefs: [
        { headerName: 'Name', field: 'name', sortable: true },
        { headerName: 'Email', field: 'email', sortable: true },
        { headerName: 'Status', field: 'status', sortable: true }
      ],
      rowData: this.data,
      pagination: true,
      paginationPageSize: 20
    };
  }
}
```

⚠️ **Note**: Filters are not available in AG Grid Community. Use sorting and external search components instead.

## Configuration Options

### Essential Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columnDefs` | `ColDef[]` | **Required** | Column definitions |
| `rowData` | `T[]` | **Required** | Data array |
| `loading` | `boolean` | `false` | Show loading overlay |
| `error` | `string` | `null` | Show error message |

### Common Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `pagination` | `boolean` | `true` | Enable pagination |
| `paginationPageSize` | `number` | `20` | Rows per page |
| `rowSelection` | `'single' \| 'multiple' \| RowSelectionOptions` | `'single'` | Selection mode (v34+ API) |
| `animateRows` | `boolean` | `false` | Row animations |
| `suppressMovableColumns` | `boolean` | `true` | Prevent column reordering |

⚠️ **Deprecated Properties Removed**: `suppressRowClickSelection`, `enableFilter` - Use modern `rowSelection` API instead.

## Column Types

### 1. Text Columns

```typescript
{ 
  headerName: 'Name', 
  field: 'name', 
  sortable: true,
  flex: 1 // Responsive width
}
```

⚠️ **No Filters**: Community version does not support `filter: true` or any filter properties.

### 2. Status Columns

```typescript
{ 
  headerName: 'Status', 
  field: 'isActive',
  cellRenderer: StatusCellRendererComponent,
  width: 120
}
```

### 3. Action Columns

```typescript
{
  headerName: 'Actions',
  field: 'actions',
  cellRenderer: ActionCellRendererComponent,
  cellRendererParams: {
    onEdit: (item) => this.editItem(item),
    onDelete: (item) => this.deleteItem(item),
    showEdit: true,
    showDelete: true
  },
  sortable: false,
  width: 120,
  pinned: 'right'
}
```

### 4. Multi-Select with Checkboxes (Modern v34+ API)

⚠️ **Updated API**: Column-level `checkboxSelection` is deprecated. Use `rowSelection` configuration instead.

```typescript
// ✅ Modern way (v34+): Configure in grid options
gridConfig: AgGridConfig = {
  columnDefs: [
    {
      headerName: 'Name',
      field: 'name',
      sortable: true,
      flex: 1
    }
    // No checkbox properties here!
  ],
  rowData: this.data,
  rowSelection: {
    mode: 'multiRow',
    enableClickSelection: false, // Only checkbox selection
    checkboxes: true, // Show checkboxes in first column
    headerCheckbox: true // Show select-all checkbox in header
  }
};

// ❌ Deprecated way (pre-v32):
// checkboxSelection: true,
// headerCheckboxSelection: true
```

## Pre-built Cell Renderers

### Available Renderers

| Renderer | Use Case | Example |
|----------|----------|---------|
| `StatusCellRendererComponent` | Active/Inactive status | User status, order status |
| `ActionCellRendererComponent` | Edit/Delete buttons | Table actions |
| `UserInfoCellRendererComponent` | User details with avatar | User lists |
| `RolesCellRendererComponent` | Role badges | User roles, permissions |

### Custom Cell Renderer

```typescript
@Component({
  selector: 'app-custom-renderer',
  standalone: true,
  template: `<span class="badge">{{ displayValue }}</span>`
})
export class CustomRendererComponent implements ICellRendererAngularComp {
  displayValue: string = '';

  agInit(params: ICellRendererParams): void {
    this.displayValue = this.formatValue(params.value);
  }

  refresh(params: ICellRendererParams): boolean {
    this.displayValue = this.formatValue(params.value);
    return true;
  }

  private formatValue(value: any): string {
    // Your custom formatting logic
    return value?.toString() || '';
  }
}
```

## Common Patterns

### 1. Simple Data Table

```typescript
// Component
this.gridConfig = {
  columnDefs: [
    { headerName: 'ID', field: 'id', width: 80 },
    { headerName: 'Name', field: 'name', flex: 1 },
    { headerName: 'Created', field: 'createdAt', width: 150 }
  ],
  rowData: this.items
};
```

### 2. Table with Actions

```typescript
// Component
this.gridConfig = {
  columnDefs: [
    { headerName: 'Name', field: 'name', flex: 1 },
    { headerName: 'Status', field: 'status', cellRenderer: StatusCellRendererComponent },
    {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: ActionCellRendererComponent,
      cellRendererParams: {
        onEdit: (item) => this.router.navigate(['/edit', item.id]),
        onDelete: (item) => this.confirmDelete(item)
      },
      pinned: 'right',
      width: 120
    }
  ],
  rowData: this.items
};

// Methods
editItem(item: any) {
  this.router.navigate(['/edit', item.id]);
}

confirmDelete(item: any) {
  if (confirm('Are you sure?')) {
    this.deleteItem(item.id);
  }
}
```

### 3. Multi-Select Table with Bulk Actions (Modern v34+ API)

```typescript
// Component
@Component({
  template: `
    <app-ag-grid-table 
      [config]="gridConfig"
      (selectedRowsChanged)="onSelectionChanged($event)">
    </app-ag-grid-table>
    
    <div *ngIf="selectedItems.length > 0" class="bulk-actions">
      <button (click)="bulkDelete()">Delete Selected ({{ selectedItems.length }})</button>
    </div>
  `
})
export class MultiSelectTableComponent {
  selectedItems: any[] = [];
  
  gridConfig: AgGridConfig = {
    columnDefs: [
      { 
        headerName: 'Name', 
        field: 'name', 
        flex: 1 
      },
      { headerName: 'Status', field: 'status' }
    ],
    rowData: this.items,
    rowSelection: {
      mode: 'multiRow',
      enableClickSelection: false, // Only checkbox selects
      checkboxes: true,
      headerCheckbox: true
    }
  };

  onSelectionChanged(selectedRows: any[]) {
    this.selectedItems = selectedRows;
  }

  bulkDelete() {
    const ids = this.selectedItems.map(item => item.id);
    this.service.deleteMultiple(ids).subscribe(() => {
      this.loadData();
    });
  }
}
```

⚠️ **Breaking Change**: `suppressRowClickSelection: true` is deprecated. Use `enableClickSelection: false` in `rowSelection` instead.

## Using UserGridService (For User Tables)

The `UserGridService` provides pre-configured setups for user-related tables:

```typescript
// Inject service
constructor(private userGridService: UserGridService) {}

// Create user grid configuration
this.gridConfig = this.userGridService.createUserGridConfig(
  this.users,           // User data array
  this.loading,         // Loading state
  this.error,           // Error message
  (user) => this.editUser(user),           // Edit callback
  (user) => this.toggleStatus(user),       // Status toggle callback
  true,                 // Enable multi-select
  (action, user, callback) => this.showConfirmation(action, user, callback) // Confirmation callback
);
```

## Loading and Error States

```typescript
// Show loading
this.gridConfig = {
  ...this.gridConfig,
  loading: true,
  rowData: []
};

// Show error
this.gridConfig = {
  ...this.gridConfig,
  loading: false,
  error: 'Failed to load data',
  rowData: []
};

// Show data
this.gridConfig = {
  ...this.gridConfig,
  loading: false,
  error: null,
  rowData: this.data
};
```

## Quick Setup Checklist

### ✅ For a New Grid:

1. **Import components** in your module/component
2. **Add template** with `<app-ag-grid-table>`
3. **Define columnDefs** array with your columns
4. **Set rowData** to your data array
5. **Add pagination** if needed
6. **Handle loading/error** states

### ✅ For Multi-Select (Modern v34+ API):

1. ❌ **Don't use**: `checkboxSelection: true` in column definitions (deprecated)
2. ❌ **Don't use**: `headerCheckboxSelection: true` in column definitions (deprecated) 
3. ❌ **Don't use**: `suppressRowClickSelection: true` (deprecated)
4. ❌ **Don't use**: `rowSelection: 'multiple'` (deprecated string format)
5. ✅ **Use**: `rowSelection.mode: 'multiRow'` in grid configuration
6. ✅ **Use**: `rowSelection.checkboxes: true` for checkbox display
7. ✅ **Use**: `rowSelection.headerCheckbox: true` for select-all
8. ✅ **Use**: `rowSelection.enableClickSelection: false` to disable row clicks
9. Handle `(selectedRowsChanged)` event

### ✅ For Actions:

1. Add action column with `ActionCellRendererComponent`
2. Configure `cellRendererParams` with callbacks
3. Set `pinned: 'right'` and `sortable: false`

## Best Practices

- **Use `flex` for responsive columns**: `flex: 1` instead of fixed width
- **Always handle loading states**: Show loading spinner while fetching data
- **Provide error handling**: Display meaningful error messages
- **Use appropriate cell renderers**: StatusCellRenderer for status, ActionCellRenderer for buttons
- **Optimize for performance**: Use pagination for large datasets
- **Test responsiveness**: Ensure table works on mobile devices
- **⚠️ No filters in Community**: Use external search/filter components instead
- **Use modern APIs**: Avoid deprecated properties like `checkboxSelection` in columns

## Example: Complete Product Table

```typescript
@Component({
  selector: 'app-products',
  template: `
    <app-ag-grid-table 
      [config]="gridConfig"
      (selectedRowsChanged)="onSelectionChanged($event)">
    </app-ag-grid-table>
  `
})
export class ProductsComponent implements OnInit {
  gridConfig: AgGridConfig<Product>;
  products: Product[] = [];
  selectedProducts: Product[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.setupGrid();
    this.loadProducts();
  }

  private setupGrid() {
    this.gridConfig = {
      columnDefs: [
        {
          headerName: 'Product',
          field: 'name',
          flex: 2
        },
        {
          headerName: 'Price',
          field: 'price',
          width: 120,
          valueFormatter: (params) => `$${params.value}`
        },
        {
          headerName: 'Status',
          field: 'isActive',
          cellRenderer: StatusCellRendererComponent,
          width: 120
        },
        {
          headerName: 'Actions',
          field: 'actions',
          cellRenderer: ActionCellRendererComponent,
          cellRendererParams: {
            onEdit: (product) => this.editProduct(product),
            onDelete: (product) => this.deleteProduct(product)
          },
          width: 120,
          pinned: 'right'
        }
      ],
      rowData: [],
      loading: true,
      rowSelection: {
        mode: 'multiRow',
        enableClickSelection: false,
        checkboxes: true,
        headerCheckbox: true
      },
      pagination: true,
      paginationPageSize: 20
    };
  }

  private loadProducts() {
    this.gridConfig.loading = true;
    
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.gridConfig = {
          ...this.gridConfig,
          rowData: products,
          loading: false,
          error: null
        };
      },
      error: (error) => {
        this.gridConfig = {
          ...this.gridConfig,
          loading: false,
          error: 'Failed to load products'
        };
      }
    });
  }

  onSelectionChanged(selectedRows: Product[]) {
    this.selectedProducts = selectedRows;
  }

  editProduct(product: Product) {
    // Navigate to edit page or open modal
  }

  deleteProduct(product: Product) {
    if (confirm(`Delete ${product.name}?`)) {
      // Delete product
    }
  }
}
```

This setup gives you a fully functional, professional data table in just a few lines of code!

## AG Grid Community Limitations & Alternatives

### 🚫 Features NOT Available in Community Version

| Feature | Enterprise Only | Community Alternative |
|---------|----------------|----------------------|
| **Column Filters** | ✅ Set filters, text filters, number filters | Use external search components |
| **Row Grouping** | ✅ Group by columns | Implement grouping in your service layer |
| **Pivoting** | ✅ Pivot tables | Use separate charting components |
| **Advanced Export** | ✅ Excel export with styling | Basic CSV export available |
| **Context Menu** | ✅ Right-click menus | Use action columns instead |
| **Range Selection** | ✅ Excel-like selection | Single/multi row selection only |
| **Master Detail** | ✅ Expandable rows | Use separate detail views |

### ✅ Recommended Alternatives

#### External Search/Filter Components

Instead of built-in filters, create external search controls:

```typescript
@Component({
  template: `
    <!-- Search controls -->
    <div class="mb-4 flex gap-4">
      <input 
        [(ngModel)]="searchTerm" 
        (ngModelChange)="onSearch()"
        placeholder="Search users..."
        class="px-3 py-2 border rounded">
        
      <select 
        [(ngModel)]="statusFilter" 
        (ngModelChange)="onFilterChange()"
        class="px-3 py-2 border rounded">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
    
    <!-- AG Grid table -->
    <app-ag-grid-table [config]="gridConfig"></app-ag-grid-table>
  `
})
export class UsersWithSearchComponent {
  searchTerm = '';
  statusFilter = '';
  allUsers: User[] = [];
  filteredUsers: User[] = [];

  onSearch() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  private applyFilters() {
    this.filteredUsers = this.allUsers.filter(user => {
      const matchesSearch = !this.searchTerm || 
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
        
      const matchesStatus = !this.statusFilter || 
        (this.statusFilter === 'active' && user.isActive) ||
        (this.statusFilter === 'inactive' && !user.isActive);
        
      return matchesSearch && matchesStatus;
    });
    
    this.gridConfig = {
      ...this.gridConfig,
      rowData: this.filteredUsers
    };
  }
}
```

#### Pagination for Performance

For large datasets, implement server-side pagination:

```typescript
loadUsers(page: number = 1, pageSize: number = 20) {
  this.gridConfig.loading = true;
  
  this.userService.getUsers({ page, pageSize, search: this.searchTerm }).subscribe({
    next: (response) => {
      this.gridConfig = {
        ...this.gridConfig,
        rowData: response.items,
        loading: false,
        error: null
      };
      
      this.totalItems = response.totalCount;
      this.currentPage = page;
    },
    error: (error) => {
      this.gridConfig = {
        ...this.gridConfig,
        loading: false,
        error: 'Failed to load users'
      };
    }
  });
}
```

#### Data Export (CSV)

For data export functionality:

```typescript
exportToCsv() {
  const csvData = this.filteredUsers.map(user => ({
    Name: user.name,
    Email: user.email,
    Status: user.isActive ? 'Active' : 'Inactive',
    'Created Date': user.createdAt?.toLocaleDateString()
  }));
  
  const csv = this.convertToCsv(csvData);
  this.downloadCsv(csv, 'users.csv');
}

private convertToCsv(data: any[]): string {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

private downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
```

### 📊 Performance Best Practices

1. **Use pagination** for datasets > 100 rows
2. **Implement virtual scrolling** for very large datasets
3. **Debounce search inputs** to avoid excessive API calls
4. **Use OnPush change detection** for better performance
5. **Implement lazy loading** for related data

```typescript
// Debounced search example
searchSubject = new Subject<string>();

ngOnInit() {
  this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged()
  ).subscribe(term => {
    this.searchTerm = term;
    this.applyFilters();
  });
}

onSearchInput(term: string) {
  this.searchSubject.next(term);
}
```

## Troubleshooting Common Issues

### Issue: Deprecation Warnings in Console

**Problem**: Seeing warnings about deprecated AG Grid features.

**Solution**: Ensure you're using the modern v34+ API:
- Use `rowSelection` object instead of string
- Remove `checkboxSelection` from columns
- Remove any `filter` properties

### Issue: Checkboxes Not Appearing

**Problem**: Multi-select checkboxes not showing.

**Solution**: Check your `rowSelection` configuration:
```typescript
rowSelection: {
  mode: 'multiRow',
  checkboxes: true,        // ← This enables checkboxes
  headerCheckbox: true,    // ← This enables select-all
  enableClickSelection: false
}
```

### Issue: Performance Problems with Large Data

**Problem**: Grid is slow with many rows.

**Solution**: Implement pagination or virtual scrolling:
```typescript
gridConfig = {
  // ... other config
  pagination: true,
  paginationPageSize: 50,  // Reduce page size
  cacheBlockSize: 50,      // Optimize cache
  maxBlocksInCache: 10
};
```

### Issue: Custom Cell Renderers Not Working

**Problem**: Custom components not rendering properly.

**Solution**: Ensure your component implements `ICellRendererAngularComp`:
```typescript
@Component({
  selector: 'app-custom-renderer',
  standalone: true,
  template: `{{ displayValue }}`
})
export class CustomRendererComponent implements ICellRendererAngularComp {
  displayValue = '';

  agInit(params: ICellRendererParams): void {
    this.displayValue = params.value;
  }

  refresh(params: ICellRendererParams): boolean {
    this.displayValue = params.value;
    return true;  // Return true to refresh
  }
}
```

## ✅ Final Checklist

Before deploying your AG Grid implementation:

- [ ] Remove all `filter` properties from column definitions
- [ ] Remove all `checkboxSelection`/`headerCheckboxSelection` from columns
- [ ] Use modern `rowSelection` object for multi-select
- [ ] Implement external search/filter components
- [ ] Add proper loading states
- [ ] Handle error scenarios
- [ ] Test on mobile devices
- [ ] Verify no console warnings
- [ ] Test with large datasets
- [ ] Add CSV export if needed

## Version History

### v34.0.1 (Current)
- ✅ Removed all filter functionality
- ✅ Updated to modern row selection API
- ✅ Removed deprecated checkbox properties
- ✅ No deprecation warnings
- ✅ Community-only features

### Previous Versions
- v32.x: Deprecated column-level checkbox properties
- v31.x: Introduced modern row selection API
- v30.x: Legacy filter and selection APIs

# AG Grid Community v34.0.1 - Complete Usage Guide

This guide provides comprehensive information for using AG Grid Community v34.0.1 with only community features.

## Key Changes in v34.0.1

### ✅ **What's Available in Community Edition:**

1. **Modern Row Selection API** (v32.2+)
2. **Community Filters**: Text, Number, Date
3. **Pagination and Sorting**
4. **Basic Theming with themeQuartz**
5. **CSV Export**
6. **Column Resizing and Moving**
7. **Row Virtualization for Performance**

### ❌ **What's NOT Available (Enterprise Only):**

1. **SetFilter** (`agSetColumnFilter`)
2. **MultiColumnFilter** (`agMultiColumnFilter`)
3. **Advanced Filter Parameters** (values, refreshValuesOnOpen)
4. **Master-Detail Views**
5. **Tree Data**
6. **Advanced Themes**
7. **Excel Export**

## Modern Row Selection (v34.0.1)

### ✅ **New Object-Based API:**
```typescript
const config: AgGridConfig = {
  rowSelection: {
    mode: 'multiRow',           // 'singleRow' or 'multiRow'
    enableClickSelection: true,  // Allow row click selection
    checkboxes: true,           // Show selection checkboxes
    headerCheckbox: true        // Show header checkbox for select all
  }
};
```

### ✅ **Helper Method Usage:**
```typescript
// Single row selection
rowSelection: AgGridTableComponent.createRowSelectionConfig('single', false, true, false)

// Multiple row selection with checkboxes
rowSelection: AgGridTableComponent.createRowSelectionConfig('multiple', true, true, true)
```

### ❌ **Deprecated (but still supported):**
```typescript
// Old way - automatically converted
rowSelection: 'single' // or 'multiple'
suppressRowClickSelection: false
```

## Community-Compatible Filters

### ✅ **Available Filter Types:**

```typescript
const columnDefs: ColDef[] = [
  {
    field: 'name',
    filter: 'agTextColumnFilter',        // ✅ Text filtering
    filterParams: {
      filterOptions: ['contains', 'startsWith', 'endsWith'],
      suppressAndOrCondition: true
    }
  },
  {
    field: 'age',
    filter: 'agNumberColumnFilter',      // ✅ Number filtering
    filterParams: {
      filterOptions: ['equals', 'lessThan', 'greaterThan'],
      suppressAndOrCondition: true
    }
  },
  {
    field: 'joinDate',
    filter: 'agDateColumnFilter',        // ✅ Date filtering
    filterParams: {
      filterOptions: ['equals', 'lessThan', 'greaterThan'],
      suppressAndOrCondition: true
    }
  }
];
```

### ✅ **Helper Method for Easy Column Creation:**
```typescript
const columnDefs = AgGridTableComponent.createCommunityColumnDefs([
  { field: 'name', headerName: 'Full Name', filter: true, type: 'text', width: 200 },
  { field: 'age', headerName: 'Age', filter: true, type: 'number', width: 100 },
  { field: 'joinDate', headerName: 'Join Date', filter: true, type: 'date', width: 150 }
]);
```

### ❌ **Avoid These (Enterprise Only):**
```typescript
// These will cause errors in Community version
{
  field: 'status',
  filter: 'agSetColumnFilter',        // ❌ Enterprise only
  filterParams: {
    values: ['Active', 'Inactive'],   // ❌ Enterprise only
    refreshValuesOnOpen: true         // ❌ Enterprise only
  }
}
```

## Performance Optimization (Community Features)

### ✅ **Recommended Settings:**
```typescript
const gridConfig: AgGridConfig = {
  // Performance optimizations
  animateRows: false,                    // Disable animations for better performance
  suppressColumnVirtualisation: false,   // Enable column virtualization
  suppressRowVirtualisation: false,      // Enable row virtualization
  suppressMovableColumns: true,          // Disable column moving if not needed
  
  // Pagination for large datasets
  pagination: true,
  paginationPageSize: 50,               // Adjust based on your needs
  
  // Layout
  domLayout: 'autoHeight',              // Or 'normal' for fixed height
};
```

## Complete Usage Examples

### Example 1: Basic Grid with Community Features
```typescript
export class BasicGridComponent {
  columnDefs: ColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      filter: 'agTextColumnFilter',
      sortable: true,
      resizable: true,
      width: 200
    },
    {
      field: 'email',
      headerName: 'Email',
      filter: 'agTextColumnFilter',
      sortable: true,
      resizable: true,
      width: 250
    },
    {
      field: 'age',
      headerName: 'Age',
      filter: 'agNumberColumnFilter',
      sortable: true,
      resizable: true,
      width: 100
    }
  ];

  gridConfig: AgGridConfig = {
    columnDefs: this.columnDefs,
    rowData: this.users,
    rowSelection: {
      mode: 'singleRow',
      enableClickSelection: true,
      checkboxes: false,
      headerCheckbox: false
    },
    pagination: true,
    paginationPageSize: 20,
    animateRows: false,
    suppressMovableColumns: true
  };
}
```

### Example 2: Grid with Checkbox Selection
```typescript
export class CheckboxGridComponent {
  gridConfig: AgGridConfig = AgGridTableComponent.enableCheckboxSelection({
    columnDefs: this.columnDefs,
    rowData: this.data,
    pagination: true,
    paginationPageSize: 25
  });

  onSelectionChanged(selectedRows: any[]) {
    console.log(`Selected ${selectedRows.length} rows`);
  }
}
```

### Example 3: Using Helper Methods
```typescript
export class HelperMethodsComponent {
  // Create columns easily with helper method
  columnDefs = AgGridTableComponent.createCommunityColumnDefs([
    { field: 'name', headerName: 'Full Name', filter: true, type: 'text' },
    { field: 'salary', headerName: 'Salary', filter: true, type: 'number' },
    { field: 'startDate', headerName: 'Start Date', filter: true, type: 'date' }
  ]);

  // Sanitize any potentially problematic column configs
  safeColumnDefs = AgGridTableComponent.sanitizeColumnDefsForCommunity(this.columnDefs);

  gridConfig: AgGridConfig = {
    columnDefs: this.safeColumnDefs,
    rowData: this.employees,
    rowSelection: AgGridTableComponent.createRowSelectionConfig('multiple', true, true, true),
    pagination: true,
    paginationPageSize: 30
  };
}
```

## Automatic Enterprise → Community Conversion

The component automatically handles conversion of enterprise features:

### ✅ **Automatic Conversions:**
- `agSetColumnFilter` → `agTextColumnFilter`
- `agMultiColumnFilter` → `agTextColumnFilter`
- Enterprise filter parameters are removed
- Deprecated properties are handled gracefully

### ✅ **Console Warnings:**
The component logs helpful warnings when conversions occur:
```
Column 'status': Replaced agSetColumnFilter with agTextColumnFilter (Community v34.0.1)
Column 'category': Removed enterprise filter parameters
Column 'select': checkboxSelection is deprecated in v34+. Use rowSelection.checkboxes instead.
```

## Troubleshooting Common Issues

### Issue: SetFilter Module Error
**Problem:** `Unable to use filter as SetFilterModule is not registered`
**Solution:** Use community filters only or upgrade to Enterprise

```typescript
// ❌ Causes error
{ field: 'status', filter: 'agSetColumnFilter' }

// ✅ Community solution
{ field: 'status', filter: 'agTextColumnFilter' }
```

### Issue: Deprecated Row Selection Warnings
**Problem:** `rowSelection with 'single'/'multiple' is deprecated`
**Solution:** Use modern object API

```typescript
// ❌ Deprecated
rowSelection: 'multiple'

// ✅ Modern
rowSelection: { mode: 'multiRow', enableClickSelection: true, checkboxes: true }
```

### Issue: Checkbox Selection Not Working
**Problem:** Checkboxes don't appear or work
**Solution:** Use modern rowSelection API

```typescript
// ✅ Correct way for v34.0.1
rowSelection: {
  mode: 'multiRow',
  enableClickSelection: true,
  checkboxes: true,        // This enables checkboxes
  headerCheckbox: true     // This enables select-all checkbox
}
```

## Helper Methods Reference

### `createRowSelectionConfig(mode, enableCheckboxes, enableClickSelection, enableHeaderCheckbox)`
Creates modern row selection configuration.

### `createCommunityColumnDefs(columns)`
Creates column definitions with community-compatible filters.

### `sanitizeColumnDefsForCommunity(columnDefs)`
Converts enterprise features to community alternatives.

### `enableCheckboxSelection(gridConfig)`
Enables checkbox selection for an existing grid configuration.

## Best Practices for v34.0.1

1. **Always use modern row selection API**
2. **Stick to community filters only**
3. **Use helper methods for consistency**
4. **Enable performance optimizations**
5. **Test thoroughly after updates**
6. **Monitor console for warnings**

## Migration Checklist

- [ ] Update row selection to object format
- [ ] Replace enterprise filters with community alternatives
- [ ] Remove deprecated properties
- [ ] Test selection functionality
- [ ] Verify filter operations
- [ ] Check console for warnings
- [ ] Optimize performance settings
- [ ] Update to modern event handlers

# AG Grid Community v34.0.1 - Safe Configuration Guide

## Issue Resolution: SetFilter Module Error

The "Unable to use filter as SetFilterModule" error occurs when AG Grid tries to use enterprise features in the community version. This guide shows how to configure AG Grid to use only community features.

## ✅ Safe Column Configuration

### Use the Safe Helper Method
```typescript
// ✅ SAFE: Use createSafeColumnDefs for guaranteed community compatibility
const columnDefs = AgGridTableComponent.createSafeColumnDefs([
  { field: 'name', headerName: 'Name', enableFilter: true, type: 'text', width: 200 },
  { field: 'age', headerName: 'Age', enableFilter: true, type: 'number', width: 100 },
  { field: 'joinDate', headerName: 'Join Date', enableFilter: true, type: 'date', width: 150 }
]);
```

### Manual Safe Configuration
```typescript
// ✅ SAFE: Manual column definitions with only community filters
const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: 'Name',
    filter: 'agTextColumnFilter',        // ✅ Community filter
    filterParams: {
      filterOptions: ['contains', 'startsWith', 'endsWith'],
      suppressAndOrCondition: true
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'age',
    headerName: 'Age',
    filter: 'agNumberColumnFilter',      // ✅ Community filter
    filterParams: {
      filterOptions: ['equals', 'lessThan', 'greaterThan'],
      suppressAndOrCondition: true
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'email',
    headerName: 'Email',
    filter: 'agTextColumnFilter',        // ✅ Community filter
    sortable: true,
    resizable: true
    // No filterParams = uses default settings
  }
];
```

## ❌ What Causes SetFilter Errors

### Enterprise Features to Avoid
```typescript
// ❌ These will cause "SetFilterModule not found" errors
const problematicColumns: ColDef[] = [
  {
    field: 'status',
    filter: 'agSetColumnFilter',        // ❌ Enterprise only
    filterParams: {
      values: ['Active', 'Inactive'],   // ❌ Enterprise feature
      refreshValuesOnOpen: true         // ❌ Enterprise feature
    }
  },
  {
    field: 'category', 
    filter: 'agMultiColumnFilter'       // ❌ Enterprise only
  }
];
```

## 🔧 Automatic Sanitization

The component automatically converts problematic configurations:

```typescript
// Input (potentially problematic)
const inputColumns: ColDef[] = [
  { field: 'status', filter: 'agSetColumnFilter' },           // ❌ Enterprise
  { field: 'category', filter: 'agMultiColumnFilter' },       // ❌ Enterprise
  { field: 'name', filter: 'agTextColumnFilter' }             // ✅ Community
];

// After sanitization (safe for community)
const sanitizedColumns = AgGridTableComponent.sanitizeColumnDefsForCommunity(inputColumns);
// Result:
// [
//   { field: 'status', filter: 'agTextColumnFilter' },       // ✅ Converted
//   { field: 'category', filter: 'agTextColumnFilter' },     // ✅ Converted  
//   { field: 'name', filter: 'agTextColumnFilter' }          // ✅ Unchanged
// ]
```

## 🚀 Complete Safe Grid Configuration

```typescript
export class SafeGridComponent {
  // ✅ Use safe column creation
  columnDefs = AgGridTableComponent.createSafeColumnDefs([
    { field: 'id', headerName: 'ID', enableFilter: false, type: 'number', width: 80 },
    { field: 'firstName', headerName: 'First Name', enableFilter: true, type: 'text', width: 150 },
    { field: 'lastName', headerName: 'Last Name', enableFilter: true, type: 'text', width: 150 },
    { field: 'email', headerName: 'Email', enableFilter: true, type: 'text', width: 200 },
    { field: 'age', headerName: 'Age', enableFilter: true, type: 'number', width: 100 },
    { field: 'joinDate', headerName: 'Join Date', enableFilter: true, type: 'date', width: 150 }
  ]);

  // ✅ Safe grid configuration
  gridConfig: AgGridConfig = {
    columnDefs: this.columnDefs,
    rowData: this.users,
    
    // Modern row selection
    rowSelection: AgGridTableComponent.createRowSelectionConfig('multiple', true, true, true),
    
    // Community features only
    pagination: true,
    paginationPageSize: 25,
    animateRows: false,
    suppressMovableColumns: true,
    domLayout: 'autoHeight'
  };

  // ✅ Safe data handling
  users = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      age: 30,
      joinDate: new Date('2023-01-15')
    },
    // ... more data
  ];
}
```

## 📋 Module Registration (Current)

The component now uses minimal module registration to avoid conflicts:

```typescript
// Current approach - no explicit module registration
// AG Grid Community v34 includes basic modules by default
```

## 🛠️ Troubleshooting Steps

1. **Use Safe Helper Methods**: Always use `createSafeColumnDefs()` for new grids
2. **Sanitize Existing Configs**: Run existing column definitions through `sanitizeColumnDefsForCommunity()`
3. **Avoid Enterprise Features**: Stick to text, number, and date filters only
4. **Test Incrementally**: Add filters one column at a time to identify issues
5. **Check Console**: Look for AG Grid warnings about missing modules

## ✅ Community Filter Reference

### Available Filters
- `agTextColumnFilter` - Text filtering with contains/starts/ends options
- `agNumberColumnFilter` - Number filtering with equals/greater/less options  
- `agDateColumnFilter` - Date filtering with equals/greater/less options

### Safe Filter Parameters
- `filterOptions` - Array of filter operations
- `suppressAndOrCondition` - Boolean to disable AND/OR conditions
- `trimInput` - Boolean to trim whitespace
- `debounceMs` - Number for debounce delay
- `caseSensitive` - Boolean for case sensitivity

### Parameters to Avoid
- `values` - Enterprise feature for dropdown options
- `refreshValuesOnOpen` - Enterprise feature
- `suppressSelectAll` - Enterprise feature
- Complex comparator functions

# AG Grid Community v34.0.1 - Quick Reference

## ✅ Community Features Only

### Modern Row Selection (v34+)
```typescript
// Single row selection
rowSelection: { mode: 'singleRow', enableClickSelection: true, checkboxes: false }

// Multiple row selection with checkboxes
rowSelection: { mode: 'multiRow', enableClickSelection: true, checkboxes: true, headerCheckbox: true }

// Helper method (recommended)
rowSelection: AgGridTableComponent.createRowSelectionConfig('multiple', true, true, true)
```

### Community Filters Only
```typescript
// ✅ Available filters
'agTextColumnFilter'   // Text filtering
'agNumberColumnFilter' // Number filtering  
'agDateColumnFilter'   // Date filtering

// ❌ NOT available (Enterprise only)
'agSetColumnFilter'    // ❌ Enterprise
'agMultiColumnFilter'  // ❌ Enterprise
```

### Column Definition Template
```typescript
const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: 'Name',
    filter: 'agTextColumnFilter',    // ✅ Community
    sortable: true,
    resizable: true,
    width: 200,
    filterParams: {
      filterOptions: ['contains', 'startsWith', 'endsWith'],
      suppressAndOrCondition: true
    }
  }
];
```

### Grid Configuration Template
```typescript
const gridConfig: AgGridConfig = {
  columnDefs: this.columnDefs,
  rowData: this.data,
  
  // Modern row selection
  rowSelection: {
    mode: 'multiRow',
    enableClickSelection: true,
    checkboxes: true,
    headerCheckbox: true
  },
  
  // Performance & layout
  pagination: true,
  paginationPageSize: 20,
  animateRows: false,
  suppressMovableColumns: true,
  domLayout: 'autoHeight'
};
```

### Helper Methods
```typescript
// Create community-compatible columns
AgGridTableComponent.createCommunityColumnDefs([
  { field: 'name', filter: true, type: 'text' },
  { field: 'age', filter: true, type: 'number' }
])

// Sanitize existing columns
AgGridTableComponent.sanitizeColumnDefsForCommunity(columnDefs)

// Enable checkbox selection
AgGridTableComponent.enableCheckboxSelection(gridConfig)
```

### Performance Settings
```typescript
// ✅ Optimize for large datasets
animateRows: false                   // Disable animations
suppressColumnVirtualisation: false  // Enable column virtualization
suppressRowVirtualisation: false     // Enable row virtualization
pagination: true                     // Use pagination
paginationPageSize: 50              // Reasonable page size
```

## ❌ Avoid These (Enterprise or Deprecated)

```typescript
// ❌ Enterprise filters
filter: 'agSetColumnFilter'
filter: 'agMultiColumnFilter'

// ❌ Enterprise filter params
filterParams: { 
  values: [...],           // Enterprise only
  refreshValuesOnOpen: true // Enterprise only
}

// ❌ Deprecated in v34+
checkboxSelection: true           // Use rowSelection.checkboxes
headerCheckboxSelection: true     // Use rowSelection.headerCheckbox
suppressRowClickSelection: true   // Use rowSelection.enableClickSelection
rowSelection: 'single'           // Use object format
```

## Quick Setup Checklist

- [ ] Use `AgGridTableComponent.createRowSelectionConfig()` for row selection
- [ ] Use only community filters: text, number, date
- [ ] Avoid enterprise filter parameters
- [ ] Enable performance optimizations
- [ ] Use helper methods for consistency
- [ ] Test with your data to ensure no console errors

## Example Usage in Component

```typescript
export class MyGridComponent {
  columnDefs = AgGridTableComponent.createCommunityColumnDefs([
    { field: 'name', headerName: 'Name', filter: true, type: 'text' },
    { field: 'age', headerName: 'Age', filter: true, type: 'number' },
    { field: 'joinDate', headerName: 'Join Date', filter: true, type: 'date' }
  ]);

  gridConfig: AgGridConfig = {
    columnDefs: this.columnDefs,
    rowData: this.data,
    rowSelection: AgGridTableComponent.createRowSelectionConfig('multiple', true, true, true),
    pagination: true,
    paginationPageSize: 25,
    animateRows: false
  };

  onSelectionChanged(rows: any[]) {
    console.log(`${rows.length} rows selected`);
  }
}
```

```html
<app-ag-grid-table 
  [config]="gridConfig"
  (selectedRowsChanged)="onSelectionChanged($event)">
</app-ag-grid-table>
```

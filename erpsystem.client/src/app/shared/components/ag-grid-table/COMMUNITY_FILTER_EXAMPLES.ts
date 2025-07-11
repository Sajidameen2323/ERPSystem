// AG Grid Community v34.0.1 - Proper Usage Examples
// This file demonstrates correct usage of AG Grid Community features only

import { ColDef } from 'ag-grid-community';

// Example interfaces for reference (adjust import paths as needed)
interface AgGridConfig<T = any> {
  columnDefs: ColDef[];
  rowData: T[];
  rowSelection?: any;
  pagination?: boolean;
  paginationPageSize?: number;
  domLayout?: string;
  headerHeight?: number;
  rowHeight?: number;
  animateRows?: boolean;
  suppressMovableColumns?: boolean;
}

// ✅ AG Grid Community v34.0.1 compatible column definitions
export const createCommunityColumnDefs = (fields: Array<{
  field: string;
  headerName?: string;
  width?: number;
  filter?: boolean;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date';
}>): ColDef[] => {
  return fields.map(col => {
    const colDef: ColDef = {
      field: col.field,
      headerName: col.headerName || col.field,
      width: col.width,
      sortable: col.sortable ?? true,
      resizable: true,
    };

    // Add community-compatible filters only
    if (col.filter) {
      switch (col.type) {
        case 'number':
          colDef.filter = 'agNumberColumnFilter';
          break;
        case 'date':
          colDef.filter = 'agDateColumnFilter';
          break;
        case 'text':
        default:
          colDef.filter = 'agTextColumnFilter';
          break;
      }
    }

    return colDef;
  });
};

// ✅ Example usage patterns for AG Grid Community v34.0.1
export const communityExamples = {
  
  // Basic column definitions with community filters
  basicColumns: [
    {
      field: 'name',
      headerName: 'Full Name',
      filter: 'agTextColumnFilter', // ✅ Community filter
      sortable: true,
      resizable: true,
      width: 200,
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'], // ✅ Community feature
        suppressAndOrCondition: true
      }
    },
    {
      field: 'age',
      headerName: 'Age',
      filter: 'agNumberColumnFilter', // ✅ Community filter
      sortable: true,
      resizable: true,
      width: 100,
      filterParams: {
        filterOptions: ['equals', 'lessThan', 'greaterThan'], // ✅ Community feature
        suppressAndOrCondition: true
      }
    },
    {
      field: 'joinDate',
      headerName: 'Join Date',
      filter: 'agDateColumnFilter', // ✅ Community filter
      sortable: true,
      resizable: true,
      width: 150,
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : ''
    }
  ],

  // Modern row selection configurations (v34+ API)
  rowSelectionConfigs: {
    singleRow: {
      mode: 'singleRow',
      enableClickSelection: true,
      checkboxes: false,
      headerCheckbox: false
    },
    multipleRows: {
      mode: 'multiRow',
      enableClickSelection: true,
      checkboxes: false,
      headerCheckbox: false
    },
    checkboxSelection: {
      mode: 'multiRow',
      enableClickSelection: true,
      checkboxes: true,
      headerCheckbox: true
    }
  },

  // Grid configuration examples
  gridConfigs: {
    basic: {
      pagination: true,
      paginationPageSize: 20,
      domLayout: 'autoHeight',
      animateRows: false,
      suppressMovableColumns: true
    },
    performance: {
      pagination: true,
      paginationPageSize: 50,
      suppressColumnVirtualisation: false,
      suppressRowVirtualisation: false,
      animateRows: false
    }
  }
};

// ✅ Community-compatible filter types
export const communityFilters = {
  text: 'agTextColumnFilter',
  number: 'agNumberColumnFilter',
  date: 'agDateColumnFilter'
  // Note: No boolean filter in community version, use text filter instead
};

// ✅ Helper function to sanitize column definitions
export const sanitizeForCommunity = (columnDefs: ColDef[]): ColDef[] => {
  return columnDefs.map(colDef => {
    const sanitized = { ...colDef };
    
    // Replace enterprise filters with community alternatives
    if (sanitized.filter === 'agSetColumnFilter') {
      sanitized.filter = 'agTextColumnFilter';
      console.warn(`Column '${sanitized.field}': Replaced agSetColumnFilter with agTextColumnFilter`);
    }
    
    if (sanitized.filter === 'agMultiColumnFilter') {
      sanitized.filter = 'agTextColumnFilter';
      console.warn(`Column '${sanitized.field}': Replaced agMultiColumnFilter with agTextColumnFilter`);
    }

    // Remove enterprise-only filter parameters
    if (sanitized.filterParams) {
      const enterpriseParams = ['values', 'refreshValuesOnOpen', 'suppressSelectAll'];
      const hasEnterpriseParams = enterpriseParams.some(param => sanitized.filterParams![param] !== undefined);
      
      if (hasEnterpriseParams) {
        const { filterOptions, suppressAndOrCondition, trimInput, debounceMs } = sanitized.filterParams;
        sanitized.filterParams = {
          ...(filterOptions && { filterOptions }),
          ...(suppressAndOrCondition !== undefined && { suppressAndOrCondition }),
          ...(trimInput !== undefined && { trimInput }),
          ...(debounceMs !== undefined && { debounceMs })
        };
        console.warn(`Column '${sanitized.field}': Removed enterprise filter parameters`);
      }
    }
    
    return sanitized;
  });
};

// ❌ Examples of what NOT to use with Community v34.0.1:
export const avoidTheseFeatures = {
  // Enterprise-only filters (will cause errors)
  enterpriseFilters: [
    'agSetColumnFilter',     // ❌ Requires enterprise license
    'agMultiColumnFilter',   // ❌ Requires enterprise license
  ],

  // Enterprise-only filter parameters
  enterpriseFilterParams: [
    'values',               // ❌ Enterprise feature
    'refreshValuesOnOpen',  // ❌ Enterprise feature
    'suppressSelectAll',    // ❌ Enterprise feature
  ],

  // Deprecated v34+ properties
  deprecatedProperties: [
    'checkboxSelection',          // ❌ Use rowSelection.checkboxes instead
    'headerCheckboxSelection',    // ❌ Use rowSelection.headerCheckbox instead
    'suppressRowClickSelection', // ❌ Use rowSelection.enableClickSelection instead
  ]
};

// ✅ Component usage example (pseudo-code)
export const usageExample = `
// In your component:
export class MyGridComponent {
  columnDefs = createCommunityColumnDefs([
    { field: 'name', headerName: 'Name', filter: true, type: 'text' },
    { field: 'age', headerName: 'Age', filter: true, type: 'number' },
    { field: 'joinDate', headerName: 'Join Date', filter: true, type: 'date' }
  ]);

  gridConfig: AgGridConfig = {
    columnDefs: this.columnDefs,
    rowData: this.data,
    rowSelection: communityExamples.rowSelectionConfigs.checkboxSelection,
    ...communityExamples.gridConfigs.basic
  };
}

// In your template:
<app-ag-grid-table [config]="gridConfig"></app-ag-grid-table>
`;

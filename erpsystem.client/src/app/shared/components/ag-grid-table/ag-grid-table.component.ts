import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, SelectionChangedEvent, CellClickedEvent, GridOptions, themeQuartz, RowSelectionOptions } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { LucideAngularModule } from 'lucide-angular';

// Register AG Grid Community modules - Required for AG Grid v34+
ModuleRegistry.registerModules([AllCommunityModule]);

export interface AgGridConfig<T = any> {
  columnDefs: ColDef[];
  rowData: T[];
  loading?: boolean;
  error?: string | null;
  
  // Pagination (Community feature)
  pagination?: boolean;
  paginationPageSize?: number;
  
  // Row Selection (Modern v34+ API)
  rowSelection?: 'single' | 'multiple' | RowSelectionOptions;
  
  // Grid behavior (Community features)
  animateRows?: boolean;
  suppressMovableColumns?: boolean;
  
  // Layout and sizing
  headerHeight?: number;
  rowHeight?: number;
  domLayout?: 'normal' | 'autoHeight' | 'print';
  gridHeight?: number; // Fixed height for the grid (px)
  adaptiveHeight?: boolean; // Whether to use adaptive height based on content (overrides gridHeight)
  
  // Overlays
  overlayNoRowsTemplate?: string;
  overlayLoadingTemplate?: string;
  
  // Row styling
  getRowClass?: (params: any) => string | string[];
  
  // Event handlers
  onRowClicked?: (event: any) => void;
  onCellClicked?: (event: CellClickedEvent) => void;
  onSelectionChanged?: (event: SelectionChangedEvent) => void;
  
  // Legacy properties (automatically converted)
  suppressRowClickSelection?: boolean;
  enableSorting?: boolean;
  enableColResize?: boolean;
  enableClickSelection?: boolean;
  
  // Styling
  customCssClass?: string;
  darkMode?: boolean;
}

@Component({
  selector: 'app-ag-grid-table',
  standalone: true,
  imports: [CommonModule, AgGridModule, LucideAngularModule],
  templateUrl: './ag-grid-table.component.html',
  styleUrl: './ag-grid-table.component.css'
})
export class AgGridTableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() config!: AgGridConfig;
  @Output() gridReady = new EventEmitter<GridApi>();
  @Output() rowClicked = new EventEmitter<any>();
  @Output() cellClicked = new EventEmitter<CellClickedEvent>();
  @Output() selectionChanged = new EventEmitter<SelectionChangedEvent>();
  @Output() selectedRowsChanged = new EventEmitter<any[]>(); // New output for selected rows data

  private gridApi!: GridApi;
  public selectedRows: any[] = [];
  public gridOptions: GridOptions = {};
  
  // Get height class for the grid wrapper
  public get heightWrapperClass(): string {
    if (this.config?.adaptiveHeight) {
      return 'adaptive';
    }
    
    const dataLength = this.config?.rowData?.length || 0;
    if (dataLength <= 5) {
      return 'compact';
    } else if (dataLength > 15) {
      return 'expanded';
    }
    
    return ''; // Default height
  }
  
  // Get dynamic height style
  public get dynamicHeight(): string | null {
    if (this.config?.gridHeight) {
      return `${this.config.gridHeight}px`;
    }
    return null;
  }
  
  // Theme configuration using the new AG Grid theming API - Sleek Industry Standard
  public get themeConfig() {
    const isDarkMode = this.config?.darkMode || document.documentElement.classList.contains('dark');
    
    return themeQuartz.withParams({
      // Core spacing and sizing - Clean and minimal
      spacing: 8,
      
      // Professional color scheme
      accentColor: '#2563eb', // Blue-600 for professional look
      
      // Background colors - Clean and minimal
      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
      foregroundColor: isDarkMode ? '#e5e7eb' : '#374151',
      
      // Header styling - Professional
      headerBackgroundColor: isDarkMode ? '#374151' : '#f8fafc',
      headerFontSize: 13,
      headerFontWeight: 600,
      
      // Row styling - Clean lines
      rowHeight: 52, // Compact professional height
      oddRowBackgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
      
      // Borders and separators - Subtle
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
      borderRadius: 0, // Sharp corners for professional look
      
      // Selection and hover states - Subtle
      selectedRowBackgroundColor: isDarkMode ? '#1e40af' : '#dbeafe',
      rangeSelectionBackgroundColor: isDarkMode ? '#1d4ed8' : '#bfdbfe',
      
      // Typography - Professional
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 13,
      
      // Interactive elements - Professional blue theme
      checkboxCheckedShapeColor: '#2563eb',
    });
  }

  ngOnInit() {
    this.setupGridOptions();
  }

  ngOnChanges(changes: any) {
    // Update grid options when config changes
    if (changes.config && this.gridApi) {
      this.updateGridOptions();
    }
  }

  ngOnDestroy() {
    if (this.gridApi) {
      this.gridApi.destroy();
    }
  }

  private setupGridOptions() {
    // Convert legacy rowSelection to modern format
    const getRowSelectionConfig = (): RowSelectionOptions => {
      // If already using modern object format, use it directly
      if (typeof this.config.rowSelection === 'object') {
        return this.config.rowSelection;
      }
      
      // Convert legacy string format to modern object format
      const legacyMode = this.config.rowSelection || 'single';
      const mode = legacyMode === 'single' ? 'singleRow' : 'multiRow';
      const enableClickSelection = this.config.enableClickSelection ?? 
        (this.config.suppressRowClickSelection !== undefined ? !this.config.suppressRowClickSelection : true);
      
      return {
        mode: mode,
        enableClickSelection: enableClickSelection,
        checkboxes: false, // Default to false, can be overridden if needed
        headerCheckbox: false // Default to false, can be overridden if needed
      };
    };

    // Sanitize column definitions to ensure compatibility with community version
    const sanitizedColumnDefs = AgGridTableComponent.sanitizeColumnDefsForCommunity(this.config.columnDefs);

    this.gridOptions = {
      columnDefs: sanitizedColumnDefs,
      rowData: this.config.rowData,
      
      // Pagination (Community feature)
      pagination: this.config.pagination ?? true,
      paginationPageSize: this.config.paginationPageSize ?? 20,
      paginationPageSizeSelector: [10, 20, 50, 100],
      
      // Row Selection (Community v34+ API)
      rowSelection: getRowSelectionConfig(),
      
      // Basic grid features (All Community compatible)
      animateRows: false, // Keep performance optimal
      suppressMovableColumns: this.config.suppressMovableColumns ?? true,
      suppressColumnVirtualisation: false, // Community feature for performance
      suppressRowVirtualisation: false, // Community feature for performance
      
      // Layout and display
      domLayout: this.config.domLayout ?? 'normal', // Use normal layout for proper overlay display
      headerHeight: this.config.headerHeight ?? 40,
      rowHeight: this.config.rowHeight ?? 52,
      
      // Ensure minimum height for overlays
      getRowHeight: (params) => this.config.rowHeight ?? 52,
      
      // Loading states
      loading: this.config.loading ?? false,
      overlayNoRowsTemplate: this.config.overlayNoRowsTemplate ?? '<span class="text-gray-500 dark:text-gray-400">No data available</span>',
      overlayLoadingTemplate: this.config.overlayLoadingTemplate ?? '<span class="text-gray-500 dark:text-gray-400">Loading...</span>',
      
      // Row styling
      getRowClass: this.config.getRowClass,
      
      // Event handlers
      onRowClicked: (event) => {
        if (this.config.onRowClicked) {
          this.config.onRowClicked(event);
        }
        this.rowClicked.emit(event);
      },
      onCellClicked: (event) => {
        if (this.config.onCellClicked) {
          this.config.onCellClicked(event);
        }
        this.cellClicked.emit(event);
      },
      onSelectionChanged: (event) => {
        this.selectedRows = this.gridApi ? this.gridApi.getSelectedRows() : [];
        this.selectedRowsChanged.emit(this.selectedRows);
        if (this.config.onSelectionChanged) {
          this.config.onSelectionChanged(event);
        }
        this.selectionChanged.emit(event);
      }
    };
  }

  private updateGridOptions() {
    if (this.gridApi) {
      // Update loading state first
      const isLoading = this.config.loading ?? false;
      this.gridApi.setGridOption('loading', isLoading);
      
      // Update row data
      this.gridApi.setGridOption('rowData', this.config.rowData);
      
      // Update column definitions if they changed (sanitize first)
      const sanitizedColumnDefs = AgGridTableComponent.sanitizeColumnDefsForCommunity(this.config.columnDefs);
      this.gridApi.setGridOption('columnDefs', sanitizedColumnDefs);
      
      // Handle overlays based on loading state and data
      if (isLoading) {
        // Show loading overlay when loading
        this.gridApi.showLoadingOverlay();
      } else if (this.config.error) {
        // Show no rows overlay for errors (since error is displayed above grid)
        this.gridApi.showNoRowsOverlay();
      } else if (!this.config.rowData || this.config.rowData.length === 0) {
        // Show no rows overlay when no data
        this.gridApi.showNoRowsOverlay();
      } else {
        // Hide overlay when we have data and not loading
        this.gridApi.hideOverlay();
      }
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridReady.emit(this.gridApi);
    
    // Initial setup - update grid with current config
    this.updateGridOptions();
    
    // Handle initial state based on loading and error conditions
    if (this.config.loading) {
      this.gridApi.showLoadingOverlay();
    } else if (this.config.error) {
      this.gridApi.showNoRowsOverlay();
    } else if (!this.config.rowData || this.config.rowData.length === 0) {
      this.gridApi.showNoRowsOverlay();
    }
  }

  // Public methods to control the grid
  public refreshData(newData: any[]) {
    if (this.gridApi) {
      this.config.rowData = newData;
      this.gridApi.setGridOption('rowData', newData);
    }
  }

  public showLoading() {
    if (this.gridApi) {
      this.gridApi.setGridOption('loading', true);
    }
  }

  public hideOverlay() {
    if (this.gridApi) {
      this.gridApi.setGridOption('loading', false);
      this.gridApi.hideOverlay();
    }
  }

  public getSelectedRows() {
    if (this.gridApi) {
      return this.gridApi.getSelectedRows();
    }
    return [];
  }

  public getSelectedRowsCount(): number {
    return this.selectedRows.length;
  }

  public clearSelection() {
    if (this.gridApi) {
      this.gridApi.deselectAll();
      this.selectedRows = [];
      this.selectedRowsChanged.emit(this.selectedRows);
    }
  }

  public selectAllRows() {
    if (this.gridApi) {
      this.gridApi.selectAll();
      this.selectedRows = this.gridApi.getSelectedRows();
      this.selectedRowsChanged.emit(this.selectedRows);
    }
  }

  public exportToCsv() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv();
    }
  }

  public updateThemeMode(darkMode: boolean) {
    this.config.darkMode = darkMode;
    // The theme will automatically update through the getter when the grid re-renders
  }

  // Helper method for backward compatibility - no longer adds checkbox columns
  // Modern approach: Use rowSelection.checkboxes in grid configuration
  public static addCheckboxColumn(columnDefs: ColDef[]): ColDef[] {
    // Simply return the column definitions as-is
    // Checkbox selection should be configured via rowSelection.checkboxes
    return columnDefs;
  }

  // Modern way to enable checkbox selection
  public static enableCheckboxSelection(gridConfig: AgGridConfig): AgGridConfig {
    return {
      ...gridConfig,
      rowSelection: {
        mode: 'multiRow',
        enableClickSelection: true,
        checkboxes: true,
        headerCheckbox: true
      }
    };
  }

  // Helper method to create row selection config
  public static createRowSelectionConfig(
    mode: 'single' | 'multiple' = 'single',
    enableCheckboxes: boolean = false,
    enableClickSelection: boolean = true,
    enableHeaderCheckbox: boolean = false
  ): RowSelectionOptions {
    return {
      mode: mode === 'single' ? 'singleRow' : 'multiRow',
      enableClickSelection,
      checkboxes: enableCheckboxes,
      headerCheckbox: enableHeaderCheckbox
    };
  }

  // Helper method to configure column definitions for Community version (no filters)
  public static createCommunityColumnDefs(columns: Array<{
    field: string;
    headerName?: string;
    width?: number;
    sortable?: boolean;
    resizable?: boolean;
  }>): ColDef[] {
    return columns.map(col => {
      const colDef: ColDef = {
        field: col.field,
        headerName: col.headerName || col.field,
        width: col.width,
        sortable: col.sortable ?? true,
        resizable: col.resizable ?? true,
      };

      // No filters to avoid SetFilter module issues
      return colDef;
    });
  }

  // Helper method to sanitize column definitions for AG Grid Community
  public static sanitizeColumnDefsForCommunity(columnDefs: ColDef[]): ColDef[] {
    return columnDefs.map(colDef => {
      const sanitized = { ...colDef };
      
      // Remove all filter configurations to avoid SetFilter issues
      delete sanitized.filter;
      delete sanitized.filterParams;
      
      return sanitized;
    });
  }

  // Helper method to create safe community-only column definitions (no filters)
  public static createSafeColumnDefs(columns: Array<{
    field: string;
    headerName?: string;
    width?: number;
    sortable?: boolean;
    resizable?: boolean;
  }>): ColDef[] {
    return columns.map(col => {
      const colDef: ColDef = {
        field: col.field,
        headerName: col.headerName || col.field,
        width: col.width,
        sortable: col.sortable ?? true,
        resizable: col.resizable ?? true,
      };

      // No filters to avoid any filter module issues
      return colDef;
    });
  }
}

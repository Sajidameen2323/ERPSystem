import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, SelectionChangedEvent, CellClickedEvent, GridOptions, ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { LucideAngularModule } from 'lucide-angular';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export interface AgGridConfig<T = any> {
  columnDefs: ColDef[];
  rowData: T[];
  loading?: boolean;
  error?: string | null;
  pagination?: boolean;
  paginationPageSize?: number;
  rowSelection?: 'single' | 'multiple'; // Kept for backward compatibility, converted to modern API internally
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
  darkMode?: boolean; // New property to control theme
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
    this.gridOptions = {
      columnDefs: this.config.columnDefs,
      rowData: this.config.rowData,
      pagination: this.config.pagination ?? true,
      paginationPageSize: this.config.paginationPageSize ?? 20,
      paginationPageSizeSelector: [10, 20, 50, 100],
      // Use modern rowSelection object instead of deprecated string values
      rowSelection: this.config.rowSelection === 'multiple' ? 
        { 
          mode: 'multiRow',
          enableClickSelection: true
        } : 
        { 
          mode: 'singleRow', 
          enableClickSelection: true 
        },
      animateRows: false, // Disable animations for professional look
      suppressMovableColumns: this.config.suppressMovableColumns ?? true,
      domLayout: this.config.domLayout ?? 'autoHeight',
      loading: this.config.loading ?? false,
      overlayNoRowsTemplate: this.config.overlayNoRowsTemplate ?? '<span class="text-gray-500 dark:text-gray-400">No data available</span>',
      overlayLoadingTemplate: this.config.overlayLoadingTemplate ?? '<span class="text-gray-500 dark:text-gray-400">Loading...</span>',
      getRowClass: this.config.getRowClass,
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
      // Update loading state
      this.gridApi.setGridOption('loading', this.config.loading ?? false);
      
      // Update row data
      this.gridApi.setGridOption('rowData', this.config.rowData);
      
      // Update column definitions if they changed
      this.gridApi.setGridOption('columnDefs', this.config.columnDefs);
      
      // Hide overlay if we have data and not loading
      if (!this.config.loading && this.config.rowData && this.config.rowData.length > 0) {
        this.gridApi.hideOverlay();
      }
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridReady.emit(this.gridApi);
    
    // Initial setup - update grid with current config
    this.updateGridOptions();
    
    // Show error overlay if there's an error
    if (this.config.error) {
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
}

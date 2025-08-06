import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, CheckSquare, Square, Minus } from 'lucide-angular';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  sortKey?: string; // Alternative sort key if different from display key
  width?: string; // CSS width (e.g., '200px', '20%', 'auto')
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  cellClass?: string;
  headerClass?: string;
  cellRenderer?: (value: any, row: T, column: TableColumn<T>) => string;
  cellComponent?: any; // Custom component for cell rendering
}

export interface TableConfig<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  
  // Pagination
  pagination?: boolean;
  pageSize?: number;
  currentPage?: number;
  totalItems?: number;
  pageSizeOptions?: number[];
  
  // Selection
  selectable?: boolean;
  multiSelect?: boolean;
  selectedRows?: T[];
  rowIdKey?: string; // Key to use for row identification (default: 'id')
  
  // Sorting
  sortable?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  
  // Row styling
  rowClass?: (row: T, index: number) => string;
  
  // Empty state
  emptyMessage?: string;
  
  // Actions
  actions?: TableAction<T>[];
}

export interface TableAction<T = any> {
  label: string;
  icon?: any;
  action: (row: T) => void;
  class?: string;
  disabled?: (row: T) => boolean;
  visible?: (row: T) => boolean;
}

export interface TableSortEvent {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export interface TablePageEvent {
  currentPage: number;
  pageSize: number;
}

export interface TableSelectionEvent<T = any> {
  selectedRows: T[];
  allSelected: boolean;
  selectedCount: number;
}

@Component({
  selector: 'app-custom-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.css'
})
export class CustomTableComponent<T = any> implements OnInit, OnChanges {
  @Input() config!: TableConfig<T>;
  @Output() sortChanged = new EventEmitter<TableSortEvent>();
  @Output() pageChanged = new EventEmitter<TablePageEvent>();
  @Output() selectionChanged = new EventEmitter<TableSelectionEvent<T>>();
  @Output() rowClicked = new EventEmitter<T>();
  @Output() actionClicked = new EventEmitter<{ action: TableAction<T>, row: T }>();

  readonly icons = {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUp,
    ArrowDown,
    CheckSquare,
    Square,
    Minus
  };

  // Internal state
  internalSelectedRows: T[] = [];
  allSelected = false;
  indeterminate = false;
  
  // Pagination state
  totalPages = 0;
  visiblePages: number[] = [];
  
  // Default configuration
  private defaultConfig: Partial<TableConfig<T>> = {
    pagination: true,
    pageSize: 10,
    currentPage: 1,
    pageSizeOptions: [5, 10, 25, 50, 100],
    sortable: true,
    multiSelect: false,
    rowIdKey: 'id',
    emptyMessage: 'No data available'
  };

  ngOnInit() {
    this.initializeConfig();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config']) {
      this.initializeConfig();
      this.updateSelectionState();
    }
  }

  private initializeConfig() {
    // Merge default config with provided config
    this.config = { ...this.defaultConfig, ...this.config };
    this.updatePaginationInfo();
  }

  private updatePaginationInfo() {
    if (this.config.pagination && this.config.totalItems) {
      this.totalPages = Math.ceil(this.config.totalItems / (this.config.pageSize || 10));
      this.updateVisiblePages();
    }
  }

  private updateVisiblePages() {
    const current = this.config.currentPage || 1;
    const total = this.totalPages;
    const maxVisible = 5;
    
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    this.visiblePages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // Sorting methods
  onSort(column: TableColumn<T>) {
    if (!column.sortable || this.config.loading) return;
    
    const sortKey = column.sortKey || column.key;
    let newDirection: 'asc' | 'desc' = 'asc';
    
    if (this.config.sortBy === sortKey) {
      newDirection = this.config.sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    this.config.sortBy = sortKey;
    this.config.sortDirection = newDirection;
    
    this.sortChanged.emit({
      sortBy: sortKey,
      sortDirection: newDirection
    });
  }

  getSortIcon(column: TableColumn<T>): any {
    if (!column.sortable) return null;
    
    const sortKey = column.sortKey || column.key;
    if (this.config.sortBy !== sortKey) return null;
    
    return this.config.sortDirection === 'asc' ? this.icons.ArrowUp : this.icons.ArrowDown;
  }

  // Pagination methods
  onPageSizeChange(newPageSize: number) {
    this.config.pageSize = newPageSize;
    this.config.currentPage = 1; // Reset to first page
    this.updatePaginationInfo();
    
    this.pageChanged.emit({
      currentPage: 1,
      pageSize: newPageSize
    });
  }

  onPageChange(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages || this.config.loading) return;
    
    this.config.currentPage = newPage;
    this.updateVisiblePages();
    
    this.pageChanged.emit({
      currentPage: newPage,
      pageSize: this.config.pageSize || 10
    });
  }

  // Selection methods
  onSelectAll() {
    if (this.config.loading) return;
    
    if (this.allSelected) {
      this.internalSelectedRows = [];
    } else {
      this.internalSelectedRows = [...this.config.data];
    }
    
    this.updateSelectionState();
    this.emitSelectionChange();
  }

  onSelectRow(row: T, event?: Event) {
    if (this.config.loading) return;
    
    event?.stopPropagation();
    
    const rowId = this.getRowId(row);
    const index = this.internalSelectedRows.findIndex(r => this.getRowId(r) === rowId);
    
    if (this.config.multiSelect) {
      if (index > -1) {
        this.internalSelectedRows.splice(index, 1);
      } else {
        this.internalSelectedRows.push(row);
      }
    } else {
      this.internalSelectedRows = index > -1 ? [] : [row];
    }
    
    this.updateSelectionState();
    this.emitSelectionChange();
  }

  isRowSelected(row: T): boolean {
    const rowId = this.getRowId(row);
    return this.internalSelectedRows.some(r => this.getRowId(r) === rowId);
  }

  private updateSelectionState() {
    const totalRows = this.config.data.length;
    const selectedCount = this.internalSelectedRows.length;
    
    this.allSelected = totalRows > 0 && selectedCount === totalRows;
    this.indeterminate = selectedCount > 0 && selectedCount < totalRows;
  }

  private emitSelectionChange() {
    this.selectionChanged.emit({
      selectedRows: [...this.internalSelectedRows],
      allSelected: this.allSelected,
      selectedCount: this.internalSelectedRows.length
    });
  }

  private getRowId(row: T): any {
    const idKey = this.config.rowIdKey || 'id';
    return (row as any)[idKey];
  }

  // Cell value methods
  getCellValue(row: T, column: TableColumn<T>): string {
    const value = (row as any)[column.key];
    
    if (column.cellRenderer) {
      return column.cellRenderer(value, row, column);
    }
    
    return value != null ? String(value) : '';
  }

  // Row methods
  onRowClick(row: T) {
    if (!this.config.loading) {
      this.rowClicked.emit(row);
    }
  }

  getRowClass(row: T, index: number): string {
    let classes = 'table-row';
    
    if (this.config.rowClass) {
      classes += ' ' + this.config.rowClass(row, index);
    }
    
    if (this.isRowSelected(row)) {
      classes += ' selected';
    }
    
    return classes;
  }

  // Action methods
  onActionClick(action: TableAction<T>, row: T, event: Event) {
    event.stopPropagation();
    
    if (action.disabled && action.disabled(row)) return;
    
    this.actionClicked.emit({ action, row });
  }

  isActionVisible(action: TableAction<T>, row: T): boolean {
    return action.visible ? action.visible(row) : true;
  }

  isActionDisabled(action: TableAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  getActionButtonClass(action: TableAction<T>): string {
    const baseClasses = '';
    
    switch (action.class) {
      case 'edit-action':
        return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800';
      case 'activate-action':
        return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800';
      case 'deactivate-action':
        return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800';
      default:
        return 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600';
    }
  }

  // Utility methods
  getStartRecord(): number {
    if (!this.config.pagination) return 1;
    return ((this.config.currentPage || 1) - 1) * (this.config.pageSize || 10) + 1;
  }

  getEndRecord(): number {
    if (!this.config.pagination) return this.config.data.length;
    const start = this.getStartRecord();
    return Math.min(start + (this.config.pageSize || 10) - 1, this.config.totalItems || this.config.data.length);
  }

  getTotalRecords(): number {
    return this.config.totalItems || this.config.data.length;
  }

  getTotalColumns(): number {
    let count = this.config.columns.length;
    if (this.config.selectable) count++;
    if (this.config.actions && this.config.actions.length > 0) count++;
    return count;
  }

  // Method for creating injector for custom cell components (if needed in future)
  createCellInjector(row: T, column: TableColumn<T>): any {
    // This can be implemented when we need to pass data to custom cell components
    return null;
  }
}

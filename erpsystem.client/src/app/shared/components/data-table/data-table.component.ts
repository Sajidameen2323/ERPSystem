import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Filter, Download, Plus, RefreshCw } from 'lucide-angular';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'number' | 'date' | 'currency' | 'status' | 'actions';
}

export interface TableAction {
  label: string;
  icon?: any;
  action: string;
  class?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading = false;
  @Input() searchable = true;
  @Input() filterable = false;
  @Input() exportable = false;
  @Input() selectable = false;
  @Input() actions: TableAction[] = [];
  @Input() emptyMessage = 'No data available';
  @Input() itemsPerPage = 10;
  @Input() showAddButton = false;
  @Input() addButtonLabel = 'Add New';

  @Output() rowSelected = new EventEmitter<any>();
  @Output() actionClicked = new EventEmitter<{action: string, item: any}>();
  @Output() sortChanged = new EventEmitter<{column: string, direction: 'asc' | 'desc'}>();
  @Output() addClicked = new EventEmitter<void>();
  @Output() exportClicked = new EventEmitter<void>();
  @Output() refreshClicked = new EventEmitter<void>();

  // Icons
  readonly SearchIcon = Search;
  readonly FilterIcon = Filter;
  readonly DownloadIcon = Download;
  readonly PlusIcon = Plus;
  readonly RefreshIcon = RefreshCw;

  // State
  searchTerm = '';
  selectedItems = new Set<any>();
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage = 1;

  // Math property for template
  readonly Math = Math;

  get filteredData() {
    let filtered = this.data;

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(item =>
        this.columns.some(column =>
          String(this.getCellValue(item, column))
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (this.sortColumn) {
      filtered = filtered.sort((a, b) => {
        const aVal = this.getCellValue(a, { key: this.sortColumn } as TableColumn);
        const bVal = this.getCellValue(b, { key: this.sortColumn } as TableColumn);
        
        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }

  get paginatedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  getCellValue(item: any, column: TableColumn) {
    const value = item[column.key];
    
    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value || 0);
      
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      
      case 'number':
        return new Intl.NumberFormat().format(value || 0);
      
      default:
        return value || '';
    }
  }

  getCellClass(column: TableColumn): string {
    const alignClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    }[column.align || 'left'];

    return `px-6 py-4 whitespace-nowrap text-sm ${alignClass}`;
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };

    return statusClasses[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }

  onSort(column: TableColumn) {
    if (!column.sortable) return;

    if (this.sortColumn === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    this.sortChanged.emit({
      column: this.sortColumn,
      direction: this.sortDirection
    });
  }

  onRowSelect(item: any) {
    if (this.selectable) {
      if (this.selectedItems.has(item)) {
        this.selectedItems.delete(item);
      } else {
        this.selectedItems.add(item);
      }
      this.rowSelected.emit(Array.from(this.selectedItems));
    }
  }

  onActionClick(action: string, item: any) {
    this.actionClicked.emit({ action, item });
  }

  onAdd() {
    this.addClicked.emit();
  }

  onExport() {
    this.exportClicked.emit();
  }

  onRefresh() {
    this.refreshClicked.emit();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  selectAll() {
    if (this.selectedItems.size === this.paginatedData.length) {
      this.selectedItems.clear();
    } else {
      this.paginatedData.forEach(item => this.selectedItems.add(item));
    }
    this.rowSelected.emit(Array.from(this.selectedItems));
  }

  isSelected(item: any): boolean {
    return this.selectedItems.has(item);
  }

  get isAllSelected(): boolean {
    return this.paginatedData.length > 0 && 
           this.paginatedData.every(item => this.selectedItems.has(item));
  }

  get isIndeterminate(): boolean {
    const selectedCount = this.paginatedData.filter(item => this.selectedItems.has(item)).length;
    return selectedCount > 0 && selectedCount < this.paginatedData.length;
  }

  trackByIndex(index: number): number {
    return index;
  }
}

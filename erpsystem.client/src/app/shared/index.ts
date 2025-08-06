// Export all custom table components and services
export { CustomTableComponent } from './components/custom-table/custom-table.component';
export type { 
  TableConfig, 
  TableColumn, 
  TableAction, 
  TableSortEvent, 
  TablePageEvent, 
  TableSelectionEvent 
} from './components/custom-table/custom-table.component';

// Export table cell components
export { UserInfoCellComponent } from './components/table-cells/user-info-cell.component';
export { StatusCellComponent } from './components/table-cells/status-cell.component';
export { RolesCellComponent } from './components/table-cells/roles-cell.component';
export { ActionsCellComponent } from './components/table-cells/actions-cell.component';
export { DateCellComponent } from './components/table-cells/date-cell.component';

// Export table service
export { UserTableService } from './services/user-table.service';

// Export other shared components
export { BulkActionsComponent } from './components/bulk-actions/bulk-actions.component';
export type { BulkAction, BulkActionConfirmation } from './components/bulk-actions/bulk-actions.component';
export { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component';
export type { ConfirmationConfig } from './components/confirmation-modal/confirmation-modal.component';
export { StockMovementModalComponent } from './components/stock-movement-modal/stock-movement-modal.component';

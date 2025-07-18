import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, Search, ArrowDownUp, ArrowDown, ArrowUp, RefreshCcw } from 'lucide-angular';
import { PurchaseOrder, StockMovement, StockMovementType } from '../../shared/models/purchase-order.interface';
import { PurchaseOrderService } from '../../shared/services/purchase-order.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stock-movement-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './stock-movement-list.component.html',
  styleUrl: './stock-movement-list.component.css'
})
export class StockMovementListComponent implements OnInit {
  stockMovements: StockMovement[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  selectedType: StockMovementType | '' = '';
  page = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
 
  // Icons
  readonly FileTextIcon = FileText;
  readonly SearchIcon = Search;
  readonly ArrowDownUpIcon = ArrowDownUp;
  readonly ArrowDownIcon = ArrowDown;
  readonly ArrowUpIcon = ArrowUp;
  readonly RefreshCcwIcon = RefreshCcw;

  constructor(private purchaseOrderService: PurchaseOrderService) {}

  ngOnInit(): void {
    this.loadStockMovements();
  }

  loadStockMovements(): void {
    this.loading = true;
    this.error = null;
    this.purchaseOrderService.getStockMovements({
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: (response) => {
        this.stockMovements = response.items;
        this.totalItems = response.totalCount;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load stock movements.';
        this.loading = false;
      }
    });
  }
}

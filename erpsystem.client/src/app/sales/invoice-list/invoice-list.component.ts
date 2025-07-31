import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// Lucide Icons
import { 
  LucideAngularModule, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Filter, 
  Download, 
  Send, 
  CreditCard, 
  Copy,
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from 'lucide-angular';

// Services and Models
import { InvoiceService } from '../services/invoice.service';
import { PagedResult, Result } from '../../shared/models/common.model';
import { 
  InvoiceListItem, 
  InvoiceQueryParameters, 
  InvoiceStatus 
} from '../models/invoice.model';

// Shared Components
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    LucideAngularModule,
    LoadingSpinnerComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);

  // Expose Math for template
  readonly Math = Math;

  // Icons
  readonly SearchIcon = Search;
  readonly PlusIcon = Plus;
  readonly EditIcon = Edit;
  readonly Trash2Icon = Trash2;
  readonly EyeIcon = Eye;
  readonly FilterIcon = Filter;
  readonly DownloadIcon = Download;
  readonly SendIcon = Send;
  readonly CreditCardIcon = CreditCard;
  readonly CopyIcon = Copy;
  readonly FileTextIcon = FileText;
  readonly CalendarIcon = Calendar;
  readonly DollarSignIcon = DollarSign;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly CheckCircleIcon = CheckCircle;
  readonly ClockIcon = Clock;
  readonly XCircleIcon = XCircle;
  readonly RefreshCwIcon = RefreshCw;

  // Expose enums for template
  readonly InvoiceStatus = InvoiceStatus;

  // Signals for reactive state management
  invoices = signal<InvoiceListItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Pagination
  currentPage = signal(1);
  pageSize = signal(25);
  totalCount = signal(0);
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  // Filters and Search
  searchTerm = signal('');
  selectedCustomerId = signal<string | null>(null);
  selectedStatus = signal<InvoiceStatus | ''>('');
  startDate = signal<string>('');
  endDate = signal<string>('');
  minAmount = signal<number | null>(null);
  maxAmount = signal<number | null>(null);
  sortBy = signal('InvoiceDate');
  sortDescending = signal(true);

  // UI State
  showDeleteDialog = signal(false);
  selectedInvoiceId = signal<string | null>(null);
  selectedInvoices = signal<string[]>([]);

  // Sort options
  sortOptions = [
    { value: 'InvoiceNumber', label: 'Invoice Number' },
    { value: 'InvoiceDate', label: 'Invoice Date' },
    { value: 'DueDate', label: 'Due Date' },
    { value: 'CustomerName', label: 'Customer Name' },
    { value: 'TotalAmount', label: 'Total Amount' },
    { value: 'Status', label: 'Status' }
  ];

  // Status options for filter
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: InvoiceStatus.Draft, label: 'Draft' },
    { value: InvoiceStatus.Sent, label: 'Sent' },
    { value: InvoiceStatus.Paid, label: 'Paid' },
    { value: InvoiceStatus.PartiallyPaid, label: 'Partially Paid' },
    { value: InvoiceStatus.Overdue, label: 'Overdue' },
    { value: InvoiceStatus.Cancelled, label: 'Cancelled' },
    { value: InvoiceStatus.RefundRequested, label: 'Refund Requested' },
    { value: InvoiceStatus.Refunded, label: 'Refunded' }
  ];

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.error.set(null);

    const parameters: InvoiceQueryParameters = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      status: this.selectedStatus() as InvoiceStatus || undefined,
      customerId: this.selectedCustomerId() || undefined,
      invoiceDateFrom: this.startDate() || undefined,
      invoiceDateTo: this.endDate() || undefined,
      sortBy: this.sortBy(),
      sortDescending: this.sortDescending()
    };

    this.invoiceService.getInvoices(parameters)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result: Result<PagedResult<InvoiceListItem>>) => {
          if (result.isSuccess && result.data) {
            this.invoices.set(result.data.items);
            this.totalCount.set(result.data.totalCount);
          } else {
            console.error('Failed to load invoices:', result);
            this.error.set(result.message || 'Failed to load invoices');
          }
        },
        error: (error) => {
          console.error('Error loading invoices:', error);
          this.error.set('An unexpected error occurred while loading invoices');
        }
      });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.resetToFirstPage();
    this.loadInvoices();
  }

  onStatusChange(): void {
    this.resetToFirstPage();
    this.loadInvoices();
  }

  onDateFilterChange(): void {
    this.resetToFirstPage();
    this.loadInvoices();
  }

  onAmountFilterChange(): void {
    this.resetToFirstPage();
    this.loadInvoices();
  }

  onSortChange(): void {
    this.resetToFirstPage();
    this.loadInvoices();
  }

  toggleSortDirection(): void {
    this.sortDescending.set(!this.sortDescending());
    this.loadInvoices();
  }

  resetToFirstPage(): void {
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadInvoices();
    }
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('');
    this.selectedCustomerId.set(null);
    this.startDate.set('');
    this.endDate.set('');
    this.minAmount.set(null);
    this.maxAmount.set(null);
    this.resetToFirstPage();
    this.loadInvoices();
  }

  clearError(): void {
    this.error.set(null);
  }

  // Invoice Actions
  sendInvoice(id: string): void {
    // Check if the invoice can be sent (only Draft invoices)
    const invoice = this.invoices().find(inv => inv.id === id);
    if (invoice && invoice.status === InvoiceStatus.Draft) {
      this.invoiceService.markInvoiceAsSent(id).subscribe({
        next: (result) => {
          if (result.isSuccess) {
            this.loadInvoices(); // Refresh the list
          } else {
            this.error.set(result.error || 'Failed to send invoice');
          }
        },
        error: (error) => {
          console.error('Error sending invoice:', error);
          this.error.set('An unexpected error occurred while sending the invoice');
        }
      });
    }
  }

  duplicateInvoice(id: string): void {
    console.log('Duplicate invoice:', id);
    // TODO: Implement when service method is available
  }

  downloadPdf(id: string): void {
    console.log('Download PDF:', id);
    // TODO: Implement when service method is available
  }

  confirmDelete(id: string): void {
    // Allow showing dialog regardless of status to inform user
    this.selectedInvoiceId.set(id);
    this.showDeleteDialog.set(true);
  }

  deleteInvoice(): void {
    const id = this.selectedInvoiceId();
    if (id) {
      // Since delete button only shows for deletable invoices, we can proceed directly
      this.invoiceService.deleteInvoice(id).subscribe({
        next: (result) => {
          if (result.isSuccess) {
            this.loadInvoices(); // Refresh the list
            this.showDeleteDialog.set(false);
            this.selectedInvoiceId.set(null);
          } else {
            this.error.set(result.message || 'Failed to delete invoice');
          }
        },
        error: (error) => {
          console.error('Error deleting invoice:', error);
          this.error.set('An unexpected error occurred while deleting the invoice');
        }
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.selectedInvoiceId.set(null);
  }

  // Selection methods for batch operations
  toggleInvoiceSelection(id: string): void {
    const selected = this.selectedInvoices();
    const index = selected.indexOf(id);
    if (index > -1) {
      this.selectedInvoices.set(selected.filter(i => i !== id));
    } else {
      this.selectedInvoices.set([...selected, id]);
    }
  }

  isInvoiceSelected(id: string): boolean {
    return this.selectedInvoices().includes(id);
  }

  selectAllInvoices(): void {
    this.selectedInvoices.set(this.invoices().map(invoice => invoice.id));
  }

  clearSelection(): void {
    this.selectedInvoices.set([]);
  }

  batchSendInvoices(): void {
    const selectedIds = this.selectedInvoices();
    console.log('Batch send invoices:', selectedIds);
    // TODO: Implement when service method is available
  }

  exportInvoices(): void {
    console.log('Export invoices - TODO: Implement when service method is available');
    // TODO: Implement when service method is available
  }

  // TrackBy function for ngFor
  trackByInvoiceId(index: number, invoice: InvoiceListItem): string {
    return invoice.id;
  }

  // Action validation methods (synced with backend business rules)
  canEditInvoice(invoice: InvoiceListItem): boolean {
    // Only Draft invoices can be edited (backend: CanEditInvoiceAsync)
    return invoice.status === InvoiceStatus.Draft;
  }

  canDeleteInvoice(invoice: InvoiceListItem): boolean {
    // Only Draft invoices can be deleted (backend: DeleteInvoiceAsync uses CanEditInvoiceAsync)
    return invoice.status === InvoiceStatus.Draft;
  }

  canSendInvoice(invoice: InvoiceListItem): boolean {
    // Only Draft invoices can be sent (backend: MarkInvoiceAsSentAsync -> UpdateInvoiceStatusAsync)
    // Valid transition: Draft -> Sent
    return invoice.status === InvoiceStatus.Draft;
  }

  canRecordPayment(invoice: InvoiceListItem): boolean {
    // Only allow payment recording for invoices that can still receive payments
    // Backend: RecordPaymentAsync excludes Paid, Cancelled, Refunded and requires balance > 0
    return invoice.status !== InvoiceStatus.Paid && 
           invoice.status !== InvoiceStatus.Cancelled && 
           invoice.status !== InvoiceStatus.Refunded &&
           invoice.balanceAmount > 0;
  }

  canMarkAsPaid(invoice: InvoiceListItem): boolean {
    // Backend: UpdateInvoiceStatusAsync with valid transitions to Paid
    // Valid transitions: Sent -> Paid, PartiallyPaid -> Paid, Overdue -> Paid
    return invoice.status === InvoiceStatus.Sent || 
           invoice.status === InvoiceStatus.PartiallyPaid || 
           invoice.status === InvoiceStatus.Overdue;
  }

  canDownloadPdf(invoice: InvoiceListItem): boolean {
    // PDF can be downloaded for any non-deleted invoice
    return true;
  }

  canDuplicate(invoice: InvoiceListItem): boolean {
    // Any invoice can be duplicated (creates new draft)
    return true;
  }

  canTransitionFromSent(invoice: InvoiceListItem): boolean {
    // New transition rule: Sent can go to Paid, PartiallyPaid, Overdue, Cancelled, or Refunded
    return invoice.status === InvoiceStatus.Sent;
  }

  canTransitionFromPartiallyPaid(invoice: InvoiceListItem): boolean {
    // New transition rule: PartiallyPaid can go to Paid, Overdue, or Refunded
    return invoice.status === InvoiceStatus.PartiallyPaid;
  }

  canTransitionFromOverdue(invoice: InvoiceListItem): boolean {
    // New transition rule: Overdue can go to Paid, PartiallyPaid, or Cancelled
    return invoice.status === InvoiceStatus.Overdue;
  }

  // Utility methods
  getStatusClass(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.Draft:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case InvoiceStatus.Sent:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case InvoiceStatus.Paid:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case InvoiceStatus.PartiallyPaid:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case InvoiceStatus.Overdue:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case InvoiceStatus.Cancelled:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case InvoiceStatus.RefundRequested:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case InvoiceStatus.Refunded:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getStatusIcon(status: InvoiceStatus) {
    switch (status) {
      case InvoiceStatus.Draft:
        return this.FileTextIcon;
      case InvoiceStatus.Sent:
        return this.SendIcon;
      case InvoiceStatus.Paid:
        return this.CheckCircleIcon;
      case InvoiceStatus.PartiallyPaid:
        return this.ClockIcon;
      case InvoiceStatus.Overdue:
        return this.AlertTriangleIcon;
      case InvoiceStatus.Cancelled:
        return this.XCircleIcon;
      case InvoiceStatus.RefundRequested:
        return this.ClockIcon; // Clock icon for pending refund
      case InvoiceStatus.Refunded:
        return this.RefreshCwIcon; // Better icon for refunds
      default:
        return this.FileTextIcon;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  isOverdue(invoice: InvoiceListItem): boolean {
    return invoice.status !== InvoiceStatus.Paid && 
           invoice.status !== InvoiceStatus.Cancelled &&
           invoice.status !== InvoiceStatus.RefundRequested &&
           invoice.status !== InvoiceStatus.Refunded &&
           new Date(invoice.dueDate) < new Date();
  }

  getDaysPastDue(invoice: InvoiceListItem): number {
    if (!this.isOverdue(invoice)) return 0;
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusText(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.Draft:
        return 'Draft';
      case InvoiceStatus.Sent:
        return 'Sent';
      case InvoiceStatus.Paid:
        return 'Paid';
      case InvoiceStatus.PartiallyPaid:
        return 'Partially Paid';
      case InvoiceStatus.Overdue:
        return 'Overdue';
      case InvoiceStatus.Cancelled:
        return 'Cancelled';
      case InvoiceStatus.RefundRequested:
        return 'Refund Requested';
      case InvoiceStatus.Refunded:
        return 'Refunded';
      default:
        return 'Unknown';
    }
  }
}

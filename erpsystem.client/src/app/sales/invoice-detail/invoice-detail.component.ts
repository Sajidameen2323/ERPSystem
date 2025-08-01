import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// Lucide Icons
import { 
  LucideAngularModule, 
  ArrowLeft,
  Edit, 
  Trash2, 
  Download, 
  Send, 
  CreditCard, 
  Copy,
  FileText,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  Printer,
  Share,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
  RotateCcw
} from 'lucide-angular';

// Services and Models
import { InvoiceService } from '../services/invoice.service';
import { InvoiceExportService } from '../services/invoice-export.service';
import { Result } from '../../shared/models/common.model';
import { 
  Invoice, 
  InvoiceStatus, 
  PaymentMethod,
  InvoicePaymentRequest,
  InvoiceStatusUpdateRequest
} from '../models/invoice.model';

// Shared Components
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { InvoiceTemplateComponent } from '../components/invoice-template/invoice-template.component';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    LucideAngularModule,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    InvoiceTemplateComponent
  ],
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.css']
})
export class InvoiceDetailComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly invoiceExportService = inject(InvoiceExportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly EditIcon = Edit;
  readonly Trash2Icon = Trash2;
  readonly DownloadIcon = Download;
  readonly SendIcon = Send;
  readonly CreditCardIcon = CreditCard;
  readonly CopyIcon = Copy;
  readonly FileTextIcon = FileText;
  readonly CalendarIcon = Calendar;
  readonly DollarSignIcon = DollarSign;
  readonly UserIcon = User;
  readonly PhoneIcon = Phone;
  readonly MailIcon = Mail;
  readonly MapPinIcon = MapPin;
  readonly PrinterIcon = Printer;
  readonly ShareIcon = Share;
  readonly MoreVerticalIcon = MoreVertical;
  readonly CheckCircleIcon = CheckCircle;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly ClockIcon = Clock;
  readonly XCircleIcon = XCircle;
  readonly EyeIcon = Eye;
  readonly RefreshCwIcon = RefreshCw;
  readonly RotateCcwIcon = RotateCcw;

  // Expose enums for template
  readonly InvoiceStatus = InvoiceStatus;
  readonly PaymentMethod = PaymentMethod;

  // Signals for reactive state management
  invoice = signal<Invoice | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  // UI State
  showDeleteDialog = signal(false);
  showPaymentDialog = signal(false);
  showActionsMenu = signal(false);

  // Payment form
  paymentForm = signal({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: PaymentMethod.Cash,
    referenceNumber: '',
    notes: ''
  });

  // Computed properties
  isOverdue = computed(() => {
    const inv = this.invoice();
    // Backend logic: overdue if DueDate < DateTime.UtcNow && Status != Paid && Status != Cancelled && Status != Refunded
    return inv && 
           inv.status !== InvoiceStatus.Paid && 
           inv.status !== InvoiceStatus.Cancelled &&
           inv.status !== InvoiceStatus.Refunded &&
           new Date(inv.dueDate) < new Date();
  });

  daysPastDue = computed(() => {
    if (!this.isOverdue()) return 0;
    const inv = this.invoice();
    if (!inv) return 0;
    const today = new Date();
    const dueDate = new Date(inv.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  // Action validation based on backend business rules
  canEdit = computed(() => {
    const inv = this.invoice();
    // Only Draft invoices can be edited (backend: CanEditInvoiceAsync)
    return inv && inv.status === InvoiceStatus.Draft;
  });

  canDelete = computed(() => {
    const inv = this.invoice();
    // Only Draft invoices can be deleted (backend: DeleteInvoiceAsync uses CanEditInvoiceAsync)
    return inv && inv.status === InvoiceStatus.Draft;
  });

  canSend = computed(() => {
    const inv = this.invoice();
    // Only Draft invoices can be sent (backend: MarkInvoiceAsSentAsync -> UpdateInvoiceStatusAsync)
    // Valid transition: Draft -> Sent
    return inv && inv.status === InvoiceStatus.Draft;
  });

  canRecordPayment = computed(() => {
    const inv = this.invoice();
    // Backend: RecordPaymentAsync excludes Paid, Cancelled, RefundRequested, Refunded and requires balance > 0
    return inv && inv.status !== InvoiceStatus.Paid && 
           inv.status !== InvoiceStatus.Cancelled && 
           inv.status !== InvoiceStatus.RefundRequested &&
           inv.status !== InvoiceStatus.Refunded && 
           inv.balanceAmount > 0;
  });

  canMarkAsPaid = computed(() => {
    const inv = this.invoice();
    // Backend: UpdateInvoiceStatusAsync with valid transitions to Paid
    // Valid transitions: Sent -> Paid, PartiallyPaid -> Paid, Overdue -> Paid
    return inv && (inv.status === InvoiceStatus.Sent || 
                   inv.status === InvoiceStatus.PartiallyPaid || 
                   inv.status === InvoiceStatus.Overdue);
  });

  canProcessRefund = computed(() => {
    const inv = this.invoice();
    // Only invoices with RefundRequested status can be processed for refund
    return inv && inv.status === InvoiceStatus.RefundRequested;
  });

  canDownloadPdf = computed(() => {
    const inv = this.invoice();
    // PDF can be downloaded for any non-deleted invoice (usually Sent, Paid, etc.)
    return inv && inv.status !== InvoiceStatus.Draft;
  });

  canDuplicate = computed(() => {
    const inv = this.invoice();
    // Any invoice can be duplicated (creates new draft)
    return inv !== null;
  });

  canPrint = computed(() => {
    const inv = this.invoice();
    // Can print if invoice has been sent or is in later status
    return inv && inv.status !== InvoiceStatus.Draft;
  });

  // New computed properties for enhanced transition validation
  canTransitionFromSent = computed(() => {
    const inv = this.invoice();
    // Sent can transition to: Paid, PartiallyPaid, Overdue, Cancelled, Refunded
    return inv && inv.status === InvoiceStatus.Sent;
  });

  canTransitionFromPartiallyPaid = computed(() => {
    const inv = this.invoice();
    // PartiallyPaid can transition to: Paid, Overdue, Refunded
    return inv && inv.status === InvoiceStatus.PartiallyPaid;
  });

  canTransitionFromOverdue = computed(() => {
    const inv = this.invoice();
    // Overdue can transition to: Paid, PartiallyPaid, Cancelled
    return inv && inv.status === InvoiceStatus.Overdue;
  });

  canBeCancelledFromOverdue = computed(() => {
    const inv = this.invoice();
    // New rule: Overdue invoices can now be cancelled (e.g., when order is returned)
    return inv && inv.status === InvoiceStatus.Overdue;
  });

  canBeRefundedFromSent = computed(() => {
    const inv = this.invoice();
    // New rule: Sent invoices can be refunded (e.g., when order is returned after being sent but before payment)
    return inv && inv.status === InvoiceStatus.Sent;
  });

  canBeRefundedFromPartiallyPaid = computed(() => {
    const inv = this.invoice();
    // New rule: PartiallyPaid invoices can be refunded (e.g., when order is returned)
    return inv && inv.status === InvoiceStatus.PartiallyPaid;
  });

  isTerminalStatus = computed(() => {
    const inv = this.invoice();
    // Terminal statuses that cannot transition further
    return inv && (inv.status === InvoiceStatus.Cancelled || inv.status === InvoiceStatus.Refunded);
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadInvoice(id);
      }
    });
  }

  loadInvoice(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.invoiceService.getInvoice(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result: Result<Invoice>) => {
          if (result.isSuccess && result.data) {
            this.invoice.set(result.data);
            // Pre-fill payment amount with balance
            this.paymentForm.update(form => ({
              ...form,
              amount: result.data!.balanceAmount
            }));
          } else {
            this.error.set(result.message || 'Failed to load invoice');
          }
        },
        error: (error) => {
          console.error('Error loading invoice:', error);
          this.error.set('An unexpected error occurred while loading the invoice');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/sales/invoices']);
  }

  editInvoice(): void {
    const inv = this.invoice();
    if (inv && this.canEdit()) {
      this.router.navigate(['/dashboard/sales/invoices', inv.id, 'edit']);
    }
  }

  sendInvoice(): void {
    const inv = this.invoice();
    if (inv && this.canSend()) {
      this.invoiceService.markInvoiceAsSent(inv.id).subscribe({
        next: (result: Result<Invoice>) => {
          if (result.isSuccess) {
            this.loadInvoice(inv.id); // Refresh the invoice
          } else {
            this.error.set(result.error || 'Failed to send invoice');
          }
        },
        error: (error: any) => {
          console.error('Error sending invoice:', error);
          this.error.set('An unexpected error occurred while sending the invoice');
        }
      });
    }
  }

  duplicateInvoice(): void {
    const inv = this.invoice();
    if (inv && this.canDuplicate()) {
      // For now, navigate to create new invoice with pre-filled data
      // TODO: Implement actual duplicate functionality in service
      this.router.navigate(['/dashboard/sales/invoices/new'], {
        queryParams: { duplicateFrom: inv.id }
      });
    }
  }

  downloadPdf(): void {
    const inv = this.invoice();
    if (inv && this.canDownloadPdf()) {
      this.loading.set(true);
      this.invoiceExportService.downloadInvoicePdf(inv.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (success: boolean) => {
            if (success) {
              this.successMessage.set('PDF downloaded successfully');
              setTimeout(() => this.successMessage.set(null), 3000);
            } else {
              this.error.set('Failed to download PDF');
            }
          },
          error: (error: any) => {
            console.error('Error downloading PDF:', error);
            this.error.set('An unexpected error occurred while downloading the PDF');
          }
        });
    }
  }

  printInvoice(): void {
    const inv = this.invoice();
    if (inv && this.canPrint()) {
      // Add a small delay to ensure DOM is fully rendered
      setTimeout(() => {
        const success = this.invoiceExportService.printInvoice(inv);
        if (success) {
          this.successMessage.set('Invoice sent to printer');
          setTimeout(() => this.successMessage.set(null), 3000);
        } else {
          this.error.set('Failed to print invoice');
        }
      }, 100);
    }
  }

  exportToExcel(): void {
    const inv = this.invoice();
    if (inv) {
      const success = this.invoiceExportService.exportInvoiceToExcel(inv);
      if (success) {
        this.successMessage.set('Invoice exported to Excel successfully');
        setTimeout(() => this.successMessage.set(null), 3000);
      } else {
        this.error.set('Failed to export to Excel');
      }
    }
  }

  generateClientPdf(): void {
    const inv = this.invoice();
    console.log('Generating PDF for invoice:', inv);
    if (inv) {
      const printArea = document.getElementById('invoice-print-area');
      console.log('Print area element:', printArea);
      if (printArea) {
        this.loading.set(true);
        this.invoiceExportService.generatePdfFromElement(printArea, `invoice-${inv.invoiceNumber}.pdf`)
          .then((success: boolean) => {
            this.loading.set(false);
            if (success) {
              this.successMessage.set('PDF generated successfully');
              setTimeout(() => this.successMessage.set(null), 3000);
            } else {
              this.error.set('Failed to generate PDF');
            }
          })
          .catch((error) => {
            this.loading.set(false);
            console.error('Error generating PDF:', error);
            this.error.set('An unexpected error occurred while generating the PDF');
          });
      }
    }
  }

  showPaymentForm(): void {
    this.showPaymentDialog.set(true);
  }

  recordPayment(): void {
    const inv = this.invoice();
    const form = this.paymentForm();
    
    if (inv && this.canRecordPayment() && form.amount > 0) {
      const payment: InvoicePaymentRequest = {
        paymentAmount: form.amount,
        paymentDate: form.paymentDate,
        paymentNotes: form.notes || undefined
      };

      this.invoiceService.recordPayment(inv.id, payment).subscribe({
        next: (result: Result<Invoice>) => {
          if (result.isSuccess) {
            this.loadInvoice(inv.id); // Refresh the invoice
            this.hidePaymentForm();
          } else {
            this.error.set(result.error || 'Failed to record payment');
          }
        },
        error: (error: any) => {
          console.error('Error recording payment:', error);
          this.error.set('An unexpected error occurred while recording the payment');
        }
      });
    }
  }

  hidePaymentForm(): void {
    this.showPaymentDialog.set(false);
    // Reset form
    const inv = this.invoice();
    this.paymentForm.set({
      amount: inv?.balanceAmount || 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: PaymentMethod.Cash,
      referenceNumber: '',
      notes: ''
    });
  }

  markAsPaid(): void {
    const inv = this.invoice();
    if (inv && this.canMarkAsPaid()) {
      const statusUpdate = {
        status: InvoiceStatus.Paid,
        paidAmount: inv.totalAmount,
        paidDate: new Date().toISOString()
      };

      this.invoiceService.updateInvoiceStatus(inv.id, statusUpdate).subscribe({
        next: (result: Result<Invoice>) => {
          if (result.isSuccess) {
            this.loadInvoice(inv.id); // Refresh the invoice
          } else {
            this.error.set(result.error || 'Failed to mark invoice as paid');
          }
        },
        error: (error: any) => {
          console.error('Error marking invoice as paid:', error);
          this.error.set('An unexpected error occurred while marking the invoice as paid');
        }
      });
    }
  }

  processRefund(): void {
    const inv = this.invoice();
    if (inv && this.canProcessRefund()) {
      // For now, process the full refund amount. In a full implementation, 
      // you might want to show a dialog to allow partial refunds or add processing notes
      this.invoiceService.processRefund(inv.id, inv.refundRequestedAmount).subscribe({
        next: (result) => {
          if (result.isSuccess) {
            this.loadInvoice(inv.id); // Refresh the invoice
          } else {
            this.error.set(result.error || 'Failed to process refund');
          }
        },
        error: (error) => {
          console.error('Error processing refund:', error);
          this.error.set('An unexpected error occurred while processing the refund');
        }
      });
    }
  }

  confirmDelete(): void {
    // Show dialog regardless of status to inform user why deletion isn't possible
    this.showDeleteDialog.set(true);
  }

  deleteInvoice(): void {
    const inv = this.invoice();
    if (inv && this.canDelete()) {
      this.invoiceService.deleteInvoice(inv.id).subscribe({
        next: (result: Result<void>) => {
          if (result.isSuccess) {
            this.router.navigate(['/dashboard/sales/invoices']);
          } else {
            this.error.set(result.error || 'Failed to delete invoice');
          }
        },
        error: (error: any) => {
          console.error('Error deleting invoice:', error);
          this.error.set('An unexpected error occurred while deleting the invoice');
        }
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
  }

  clearError(): void {
    this.error.set(null);
  }

  toggleActionsMenu(): void {
    this.showActionsMenu.set(!this.showActionsMenu());
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

  formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString();
  }

  getPaymentMethodDisplayName(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CreditCard:
        return 'Credit Card';
      case PaymentMethod.BankTransfer:
        return 'Bank Transfer';
      default:
        return method;
    }
  }

  // Payment form update methods
  updatePaymentAmount(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.paymentForm.update(form => ({
      ...form,
      amount: +target.value
    }));
  }

  updatePaymentDate(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.paymentForm.update(form => ({
      ...form,
      paymentDate: target.value
    }));
  }

  updatePaymentMethod(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.paymentForm.update(form => ({
      ...form,
      paymentMethod: target.value as PaymentMethod
    }));
  }

  updateReferenceNumber(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.paymentForm.update(form => ({
      ...form,
      referenceNumber: target.value
    }));
  }

  updateNotes(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.paymentForm.update(form => ({
      ...form,
      notes: target.value
    }));
  }

  getDaysPastDue(): number {
    if (!this.isOverdue()) return 0;
    const inv = this.invoice();
    if (!inv) return 0;
    const today = new Date();
    const dueDate = new Date(inv.dueDate);
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

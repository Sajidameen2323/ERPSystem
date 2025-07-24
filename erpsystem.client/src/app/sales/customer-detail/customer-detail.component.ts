import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

// Lucide Icons
import { 
  LucideAngularModule, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  RotateCcw, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ShoppingCart,
  TrendingUp
} from 'lucide-angular';

// Services and Models
import { CustomerService } from '../services/customer.service';
import { Customer } from '../models/customer.model';

// Shared Components
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    LucideAngularModule,
    LoadingSpinnerComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.css']
})
export class CustomerDetailComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly EditIcon = Edit;
  readonly Trash2Icon = Trash2;
  readonly RotateCcwIcon = RotateCcw;
  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly MapPinIcon = MapPin;
  readonly CalendarIcon = Calendar;
  readonly ShoppingCartIcon = ShoppingCart;
  readonly TrendingUpIcon = TrendingUp;

  // Signals for reactive state management
  loading = signal(false);
  error = signal<string | null>(null);
  customer = signal<Customer | null>(null);
  customerId = signal<string | null>(null);

  // Dialog states
  showDeleteDialog = signal(false);
  showRestoreDialog = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customerId.set(id);
      this.loadCustomer(id);
    } else {
      this.error.set('Customer ID not provided');
    }
  }

  /**
   * Load customer details
   */
  private loadCustomer(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.customerService.getCustomerById(id)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (result) => {
          if (result.isSuccess && result.data) {
            this.customer.set(result.data);
          } else {
            this.error.set(result.error || 'Customer not found');
          }
        },
        error: (error) => {
          console.error('Error loading customer:', error);
          this.error.set('Failed to load customer. Please try again.');
        }
      });
  }

  /**
   * Navigate to edit page
   */
  editCustomer(): void {
    const customer = this.customer();
    if (customer) {
      this.router.navigate(['/dashboard/sales/customers', customer.id, 'edit']);
    }
  }

  /**
   * Open delete confirmation dialog
   */
  confirmDelete(): void {
    this.showDeleteDialog.set(true);
  }

  /**
   * Delete customer
   */
  deleteCustomer(): void {
    const customer = this.customer();
    if (!customer) return;

    this.loading.set(true);
    this.customerService.deleteCustomer(customer.id)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (result) => {
          if (result.isSuccess) {
            this.router.navigate(['/dashboard/sales/customers']);
          } else {
            this.error.set(result.error || 'Failed to delete customer');
            this.showDeleteDialog.set(false);
          }
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.error.set('Failed to delete customer. Please try again.');
          this.showDeleteDialog.set(false);
        }
      });
  }

  /**
   * Open restore confirmation dialog
   */
  confirmRestore(): void {
    this.showRestoreDialog.set(true);
  }

  /**
   * Restore customer
   */
  restoreCustomer(): void {
    const customer = this.customer();
    if (!customer) return;

    this.loading.set(true);
    this.customerService.restoreCustomer(customer.id)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (result) => {
          if (result.isSuccess) {
            // Reload customer to get updated data
            this.loadCustomer(customer.id);
            this.showRestoreDialog.set(false);
          } else {
            this.error.set(result.error || 'Failed to restore customer');
            this.showRestoreDialog.set(false);
          }
        },
        error: (error) => {
          console.error('Error restoring customer:', error);
          this.error.set('Failed to restore customer. Please try again.');
          this.showRestoreDialog.set(false);
        }
      });
  }

  /**
   * Close dialogs
   */
  closeDialogs(): void {
    this.showDeleteDialog.set(false);
    this.showRestoreDialog.set(false);
  }

  /**
   * Navigate back to customer list
   */
  goBack(): void {
    this.router.navigate(['/dashboard/sales/customers']);
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get customer initials for avatar
   */
  getCustomerInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}

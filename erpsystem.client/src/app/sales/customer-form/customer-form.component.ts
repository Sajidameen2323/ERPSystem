import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// Lucide Icons
import { LucideAngularModule, Save, ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-angular';

// Services and Models
import { CustomerService } from '../services/customer.service';
import { Customer, CustomerCreateRequest, CustomerUpdateRequest } from '../models/customer.model';

// Shared Components
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule, 
    LucideAngularModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css']
})
export class CustomerFormComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  // Icons
  readonly SaveIcon = Save;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly MapPinIcon = MapPin;

  // Signals for reactive state management
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  customerId = signal<string | null>(null);
  customer = signal<Customer | null>(null);

  // Form
  customerForm: FormGroup;

  // Computed values
  isEditMode = signal(false);
  pageTitle = signal('Add Customer');

  constructor() {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.email, Validators.maxLength(255)]],
      phone: ['', [Validators.maxLength(50)]],
      address: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customerId.set(id);
      this.isEditMode.set(true);
      this.pageTitle.set('Edit Customer');
      this.loadCustomer(id);
    }
  }

  /**
   * Load customer for editing
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
            this.populateForm(result.data);
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
   * Populate form with customer data
   */
  private populateForm(customer: Customer): void {
    this.customerForm.patchValue({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || ''
    });
  }

  /**
   * Submit the form
   */
  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const formValue = this.customerForm.value;
    
    if (this.isEditMode()) {
      this.updateCustomer(formValue);
    } else {
      this.createCustomer(formValue);
    }
  }

  /**
   * Create new customer
   */
  private createCustomer(customerData: CustomerCreateRequest): void {
    this.customerService.createCustomer(customerData)
      .pipe(
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: (result) => {
          if (result.isSuccess) {
            this.router.navigate(['/dashboard/sales/customers']);
          } else {
            this.error.set(result.error || 'Failed to create customer');
          }
        },
        error: (error) => {
          console.error('Error creating customer:', error);
          this.error.set('Failed to create customer. Please try again.');
        }
      });
  }

  /**
   * Update existing customer
   */
  private updateCustomer(customerData: CustomerUpdateRequest): void {
    const id = this.customerId();
    if (!id) return;

    this.customerService.updateCustomer(id, customerData)
      .pipe(
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: (result) => {
          if (result.isSuccess) {
            this.router.navigate(['/dashboard/sales/customers']);
          } else {
            this.error.set(result.error || 'Failed to update customer');
          }
        },
        error: (error) => {
          console.error('Error updating customer:', error);
          this.error.set('Failed to update customer. Please try again.');
        }
      });
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.customerForm.controls).forEach(key => {
      const control = this.customerForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Check if field has error and is touched
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.customerForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.customerForm.get(fieldName);
    
    if (field?.errors?.['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (field?.errors?.['email']) {
      return 'Please enter a valid email address';
    }
    
    if (field?.errors?.['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} cannot exceed ${maxLength} characters`;
    }
    
    return '';
  }

  /**
   * Get human-readable field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      name: 'Customer name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address'
    };
    return labels[fieldName] || fieldName;
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
}

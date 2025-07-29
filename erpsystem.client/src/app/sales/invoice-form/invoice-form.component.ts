import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { finalize } from 'rxjs';

// Lucide Icons
import { 
  LucideAngularModule, 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Search,
  Calculator
} from 'lucide-angular';

// Services and Models
import { InvoiceService } from '../services/invoice.service';
import { CustomerService } from '../services/customer.service';
import { Result } from '../../shared/models/common.model';
import { 
  Invoice, 
  UpdateInvoiceRequest
} from '../models/invoice.model';
import { Customer } from '../models/customer.model';

// Shared Components
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <button
            (click)="goBack()"
            class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <lucide-angular [img]="ArrowLeftIcon" class="w-5 h-5"></lucide-angular>
          </button>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Invoice
          </h1>
        </div>
        <div class="flex space-x-3">
          <button
            type="button"
            (click)="goBack()"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button
            (click)="saveInvoice()"
            [disabled]="loading() || !invoiceForm.valid"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center">
            <lucide-angular [img]="SaveIcon" class="w-4 h-4 mr-2"></lucide-angular>
            {{ loading() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div *ngIf="error()" class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-200">{{ error() }}</p>
      </div>

      <!-- Form -->
      <form [formGroup]="invoiceForm" class="space-y-6">
        <!-- Basic Information -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Invoice Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
              <select formControlName="customerId" 
                      class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white">
                <option value="">Select a customer</option>
                <option *ngFor="let customer of customers()" [value]="customer.id">
                  {{ customer.name }}
                </option>
              </select>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Customer is set from the original sales order</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sales Order ID</label>
              <input type="text" formControlName="salesOrderId"
                     class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white">
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Generated from the original sales order</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Date</label>
              <input type="date" formControlName="invoiceDate"
                     class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white">
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Date when the invoice was generated</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date *</label>
              <input type="date" formControlName="dueDate"
                     class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">You can modify the payment due date</p>
            </div>
          </div>
          
          <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Amount</label>
              <input type="number" formControlName="taxAmount" step="0.01" min="0"
                     class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Amount</label>
              <input type="number" formControlName="discountAmount" step="0.01" min="0"
                     class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Amount</label>
              <input type="text" [value]="calculateTotal()" readonly
                     class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white">
            </div>
          </div>
          
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Terms</label>
            <textarea formControlName="terms" rows="2"
                      class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Payment terms and conditions..."></textarea>
          </div>
          
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea formControlName="notes" rows="3"
                      class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Add any additional notes for this invoice..."></textarea>
          </div>
        </div>

        <!-- Invoice Items -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Invoice Items</h3>
          
          <div *ngIf="invoice()?.invoiceItems && invoice()!.invoiceItems.length > 0; else noItems">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit Price</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Line Total</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr *ngFor="let item of invoice()!.invoiceItems; trackBy: trackByItemId">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {{ item.productName || 'Product #' + item.productId.substring(0, 8) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {{ item.quantity }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {{ formatCurrency(item.unitPrice) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {{ formatCurrency(item.lineTotal) }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {{ item.description || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Invoice Summary -->
            <div class="mt-6 flex justify-end">
              <div class="w-64 space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal:</span>
                  <span class="text-sm text-gray-900 dark:text-white">{{ formatCurrency(invoice()!.subTotal) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Tax Amount:</span>
                  <span class="text-sm text-gray-900 dark:text-white">{{ formatCurrency(invoiceForm.get('taxAmount')?.value || 0) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Discount:</span>
                  <span class="text-sm text-red-600 dark:text-red-400">-{{ formatCurrency(invoiceForm.get('discountAmount')?.value || 0) }}</span>
                </div>
                <div class="border-t border-gray-200 dark:border-gray-600 pt-2">
                  <div class="flex justify-between">
                    <span class="text-base font-bold text-gray-900 dark:text-white">Total:</span>
                    <span class="text-base font-bold text-gray-900 dark:text-white">{{ calculateTotal() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <ng-template #noItems>
            <div class="text-center py-8">
              <p class="text-gray-500 dark:text-gray-400">No items found for this invoice.</p>
            </div>
          </ng-template>
        </div>
      </form>

      <!-- Loading Spinner -->
      <div *ngIf="loading()" class="flex justify-center items-center py-12">
        <app-loading-spinner></app-loading-spinner>
      </div>
    </div>
  `,
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly SaveIcon = Save;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly SearchIcon = Search;
  readonly CalculatorIcon = Calculator;

  // Signals
  loading = signal(false);
  error = signal<string | null>(null);
  customers = signal<Customer[]>([]);
  invoice = signal<Invoice | null>(null);

  // Form
  invoiceForm: FormGroup;

  constructor() {
    this.invoiceForm = this.fb.group({
      customerId: [{ value: '', disabled: true }], // Read-only since created from sales order
      salesOrderId: [{ value: null, disabled: true }], // Read-only since created from sales order
      invoiceDate: [{ value: '', disabled: true }], // Read-only since set when created
      dueDate: ['', Validators.required],
      taxAmount: [0, [Validators.min(0)]],
      discountAmount: [0, [Validators.min(0)]],
      notes: [''],
      terms: ['']
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
    
    // Listen to form value changes to update total
    this.invoiceForm.get('taxAmount')?.valueChanges.subscribe(() => {
      // This will trigger change detection for the calculateTotal method
    });
    
    this.invoiceForm.get('discountAmount')?.valueChanges.subscribe(() => {
      // This will trigger change detection for the calculateTotal method
    });
    
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadInvoice(id);
      } else {
        // Redirect to invoice list if no ID provided since we can't create invoices
        this.router.navigate(['/dashboard/sales/invoices']);
      }
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers({}).subscribe({
      next: (result) => {
        if (result.isSuccess && result.data) {
          this.customers.set(result.data.items);
        }
      },
      error: (error) => {
        console.error('Error loading customers:', error);
      }
    });
  }

  loadInvoice(id: string): void {
    this.loading.set(true);
    this.invoiceService.getInvoice(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          if (result.isSuccess && result.data) {
            this.invoice.set(result.data);
            this.populateForm(result.data);
          } else {
            this.error.set(result.message || 'Failed to load invoice');
          }
        },
        error: (error) => {
          console.error('Error loading invoice:', error);
          this.error.set('An unexpected error occurred');
        }
      });
  }

  populateForm(invoice: Invoice): void {
    this.invoiceForm.patchValue({
      customerId: invoice.customerId,
      salesOrderId: invoice.salesOrderId,
      invoiceDate: new Date(invoice.invoiceDate).toISOString().split('T')[0],
      dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
      taxAmount: invoice.taxAmount || 0,
      discountAmount: invoice.discountAmount || 0,
      notes: invoice.notes,
      terms: invoice.terms
    });
  }

  saveInvoice(): void {
    if (this.invoiceForm.valid && this.invoice()) {
      this.loading.set(true);
      
      const formValue = this.invoiceForm.value;
      
      const updateDto: UpdateInvoiceRequest = {
        dueDate: new Date(formValue.dueDate).toISOString(),
        taxAmount: formValue.taxAmount || 0,
        discountAmount: formValue.discountAmount || 0,
        notes: formValue.notes,
        terms: formValue.terms,
        invoiceItems: this.invoice()?.invoiceItems?.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: item.description
        })) || []
      };
      
      this.invoiceService.updateInvoice(this.invoice()!.id, updateDto)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (result) => {
            if (result.isSuccess) {
              this.router.navigate(['/dashboard/sales/invoices', this.invoice()!.id]);
            } else {
              this.error.set(result.message || 'Failed to update invoice');
            }
          },
          error: (error) => {
            console.error('Error updating invoice:', error);
            this.error.set('An unexpected error occurred');
          }
        });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/sales/invoices']);
  }

  // Utility methods
  calculateTotal(): string {
    const invoice = this.invoice();
    if (!invoice) return '$0.00';
    
    const subtotal = invoice.subTotal || 0;
    const taxAmount = this.invoiceForm.get('taxAmount')?.value || 0;
    const discountAmount = this.invoiceForm.get('discountAmount')?.value || 0;
    
    const total = subtotal + taxAmount - discountAmount;
    return this.formatCurrency(total);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  trackByItemId(index: number, item: any): string {
    return item.id;
  }
}

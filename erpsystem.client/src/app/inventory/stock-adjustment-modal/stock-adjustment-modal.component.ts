import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, X, Package, Plus, Minus, AlertCircle } from 'lucide-angular';
import { Product } from '../../shared/models/product.interface';
import { ProductService } from '../../shared/services/product.service';
import { StockAdjustment } from '../../shared/models/product.interface';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-stock-adjustment-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './stock-adjustment-modal.component.html',
  styleUrl: './stock-adjustment-modal.component.css'
})
export class StockAdjustmentModalComponent implements OnInit, OnDestroy {
  // Lucide icons
  readonly X = X;
  readonly Package = Package;
  readonly Plus = Plus;
  readonly Minus = Minus;
  readonly AlertCircle = AlertCircle;

  @Input() isVisible = false;
  @Input() product: Product | null = null;
  @Output() stockAdjusted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() visibilityChanged = new EventEmitter<boolean>();

  adjustmentForm!: FormGroup;
  
  // Signals for component state
  loading = signal(false);
  error = signal<string>('');
  
  // Predefined adjustment reasons
  adjustmentReasons = [
    'Received shipment',
    'Damaged goods',
    'Inventory count adjustment',
    'Expired products',
    'Theft/Loss',
    'Transfer to warehouse',
    'Return from customer',
    'Quality control rejection',
    'Other'
  ];

  adjustmentTypes = [
    { value: 'increase', label: 'Increase Stock', icon: Plus, color: 'text-green-600' },
    { value: 'decrease', label: 'Decrease Stock', icon: Minus, color: 'text-red-600' }
  ];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    if (this.product) {
      this.initializeForm();
    }
  }

  ngOnDestroy() {
    // Clean up any subscriptions if needed
  }

  private initializeForm() {
    this.adjustmentForm = this.fb.group({
      adjustmentType: ['increase', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required]],
      customReason: ['']
    });

    // Watch for reason changes to handle custom reason
    this.adjustmentForm.get('reason')?.valueChanges.subscribe(value => {
      const customReasonControl = this.adjustmentForm.get('customReason');
      if (value === 'Other') {
        customReasonControl?.setValidators([Validators.required, Validators.maxLength(255)]);
      } else {
        customReasonControl?.clearValidators();
        customReasonControl?.setValue('');
      }
      customReasonControl?.updateValueAndValidity();
    });
  }

  get finalQuantity(): number {
    if (!this.product || !this.adjustmentForm) return 0;
    
    const quantity = this.adjustmentForm.get('quantity')?.value || 0;
    const type = this.adjustmentForm.get('adjustmentType')?.value;
    
    return type === 'increase' 
      ? this.product.currentStock + quantity 
      : this.product.currentStock - quantity;
  }

  get isValidAdjustment(): boolean {
    if (!this.product || !this.adjustmentForm) return false;
    
    const type = this.adjustmentForm.get('adjustmentType')?.value;
    const quantity = this.adjustmentForm.get('quantity')?.value || 0;
    const quantityControl = this.adjustmentForm.get('quantity');
    
    // Check if quantity is valid (not empty and meets min validator)
    if (!quantity || !quantityControl?.valid) return false;
    
    // For decrease, ensure we don't go below 0
    if (type === 'decrease') {
      return this.product.currentStock >= quantity;
    }
    
    return true;
  }

  onSubmit() {
    if (!this.product || !this.adjustmentForm.valid || !this.isValidAdjustment) {
      this.markFormGroupTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const formValue = this.adjustmentForm.value;
    const adjustmentQuantity = formValue.adjustmentType === 'increase' 
      ? formValue.quantity 
      : -formValue.quantity;

    const reason = formValue.reason === 'Other' 
      ? formValue.customReason 
      : formValue.reason;

    const adjustment: StockAdjustment = {
      productId: this.product.id,
      adjustmentQuantity,
      reason
    };

    this.productService.adjustStock(this.product.id, adjustment).pipe(
      catchError(error => {
        this.error.set('Failed to adjust stock. Please try again.');
        console.error('Error adjusting stock:', error);
        return of(null);
      })
    ).subscribe(result => {
      this.loading.set(false);
      if (result !== null) {
        this.stockAdjusted.emit();
        this.onClose();
      }
    });
  }

  onClose() {
    this.adjustmentForm.reset();
    this.error.set('');
    this.loading.set(false);
    this.visibilityChanged.emit(false);
    this.cancelled.emit();
  }

  private markFormGroupTouched() {
    Object.keys(this.adjustmentForm.controls).forEach(key => {
      const control = this.adjustmentForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.adjustmentForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.adjustmentForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
      if (field.errors['maxlength']) return `${fieldName} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
    }
    return '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

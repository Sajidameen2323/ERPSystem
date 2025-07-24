import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { 
  LucideAngularModule, 
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  Save,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-angular';
import { Subject, takeUntil, catchError, of, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';

import { 
  CreatePurchaseOrderReturnRequest,
  AvailableReturnItem,
  PurchaseOrder,
  CreatePurchaseOrderReturnItem,
  PurchaseOrderStatus
} from '../../../shared/models/purchase-order.interface';
import { PurchaseOrderReturnService } from '../../../shared/services/purchase-order-return.service';
import { PurchaseOrderService } from '../../../shared/services/purchase-order.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { LayoutService } from '../../../shared/services/layout.service';

@Component({
  selector: 'app-return-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './return-form.component.html',
  styleUrl: './return-form.component.css'
})
export class ReturnFormComponent implements OnInit, OnDestroy {
  // Injected services
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private returnService = inject(PurchaseOrderReturnService);
  private purchaseOrderService = inject(PurchaseOrderService);
  public themeService = inject(ThemeService);
  public layoutService = inject(LayoutService);

  // State signals
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  searchingPO = signal(false);
  purchaseOrderSearchResults = signal<PurchaseOrder[]>([]);
  showSearchDropdown = signal(false);
  availableItems = signal<AvailableReturnItem[]>([]);
  selectedPurchaseOrder = signal<PurchaseOrder | null>(null);

  // Form
  returnForm!: FormGroup;

  // Computed properties
  themeClasses = computed(() => this.themeService.getClasses());
  returnReasonOptions = computed(() => this.returnService.getReturnReasonOptions());

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly PackageIcon = Package;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly SaveIcon = Save;
  readonly SearchIcon = Search;
  readonly AlertCircleIcon = AlertCircle;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly AlertTriangleIcon = AlertTriangle;

  // Reactive streams
  private destroy$ = new Subject<void>();

  // Custom Validators
  static positiveQuantityValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null; // Let required validator handle empty values
      }
      
      if (isNaN(value) || value <= 0) {
        return { positiveQuantity: { value, message: 'Quantity must be greater than 0' } };
      }
      
      return null;
    };
  }

  static maxReturnQuantityValidator(maxQuantity: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null;
      }
      
      if (isNaN(value) || value > maxQuantity) {
        return { 
          maxReturnQuantity: { 
            value, 
            maxQuantity, 
            message: `Cannot return more than ${maxQuantity} items available` 
          } 
        };
      }
      
      return null;
    };
  }

  static stockAvailabilityValidator(currentStock: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null;
      }
      
      if (isNaN(value) || value > currentStock) {
        return { 
          insufficientStock: { 
            value, 
            currentStock, 
            message: `Insufficient stock. Current stock: ${currentStock}` 
          } 
        };
      }
      
      return null;
    };
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupPurchaseOrderSearch();

    // Check if purchase order ID is provided in route
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['purchaseOrderId']) {
        this.loadPurchaseOrderForReturn(params['purchaseOrderId']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.returnForm = this.fb.group({
      purchaseOrderSearch: [''],
      purchaseOrderId: ['', Validators.required],
      notes: [''],
      items: this.fb.array([])
    });
  }

  private setupPurchaseOrderSearch(): void {
    this.returnForm.get('purchaseOrderSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        // Clear previous errors when user starts typing
        this.error.set(null);
        
        if (!searchTerm || searchTerm.length < 3) {
          this.purchaseOrderSearchResults.set([]);
          this.showSearchDropdown.set(false);
          return of(null);
        }
        
        this.searchingPO.set(true);
        return this.purchaseOrderService.getPurchaseOrders({
          page: 1,
          pageSize: 10,
          searchTerm: searchTerm,
          status: PurchaseOrderStatus.Received // Only allow returns for received orders
        }).pipe(
          catchError(error => {
            console.error('Error searching purchase orders:', error);
            this.error.set('Failed to search purchase orders. Please try again.');
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.searchingPO.set(false);
        
        if (result && result.items && result.items.length > 0) {
          this.purchaseOrderSearchResults.set(result.items);
          this.showSearchDropdown.set(true);
        } else {
          this.purchaseOrderSearchResults.set([]);
          this.showSearchDropdown.set(false);
          if (this.returnForm.get('purchaseOrderSearch')?.value?.length >= 3) {
            // Only show message if user has typed enough characters
            this.error.set('No received purchase orders found matching your search.');
          }
        }
      },
      error: (error) => {
        this.searchingPO.set(false);
        console.error('Search error:', error);
        this.error.set('Failed to search purchase orders. Please try again.');
        this.purchaseOrderSearchResults.set([]);
        this.showSearchDropdown.set(false);
      }
    });
  }

  get itemsFormArray(): FormArray {
    return this.returnForm.get('items') as FormArray;
  }

  private loadPurchaseOrderForReturn(purchaseOrderId: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Load purchase order details
    this.purchaseOrderService.getPurchaseOrder(purchaseOrderId).pipe(
      switchMap(poResult => {
        if (poResult) {
          this.selectedPurchaseOrder.set(poResult);
          this.returnForm.patchValue({
            purchaseOrderId: purchaseOrderId,
            purchaseOrderSearch: poResult.poNumber
          });
          
          // Load available items for return
          return this.returnService.getAvailableReturnItems(purchaseOrderId);
        }
        throw new Error('Purchase order not found');
      }),
      catchError(error => {
        console.error('Error loading purchase order:', error);
        this.error.set('Failed to load purchase order details. Please try again.');
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.loading.set(false);
      if (result?.data) {
        this.availableItems.set(result.data);
        this.populateAvailableItems(result.data);
      }
    });
  }

  private populateAvailableItems(items: AvailableReturnItem[]): void {
    const itemsArray = this.itemsFormArray;
    itemsArray.clear();

    items.forEach(item => {
      const validators = [
        ReturnFormComponent.positiveQuantityValidator(),
        ReturnFormComponent.maxReturnQuantityValidator(item.availableForReturn),
        ReturnFormComponent.stockAvailabilityValidator(item.currentStock)
      ];

      const itemGroup = this.fb.group({
        purchaseOrderItemId: [item.purchaseOrderItemId, Validators.required],
        productId: [item.productId, Validators.required],
        productName: [{ value: item.productName, disabled: true }],
        productSKU: [{ value: item.productSKU, disabled: true }],
        availableForReturn: [{ value: item.availableForReturn, disabled: true }],
        currentStock: [{ value: item.currentStock, disabled: true }],
        unitPrice: [{ value: item.unitPrice, disabled: true }],
        returnQuantity: [0, validators],
        reason: ['', Validators.required],
        reasonDescription: [''],
        refundRequested: [false],
        selected: [false],
        validationErrors: [{ value: [], disabled: true }] // Track validation errors for display
      });

      // Real-time validation with enhanced feedback
      itemGroup.get('returnQuantity')?.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe((quantity) => {
        this.updateItemValidation(itemGroup, item);
        this.updateItemTotal(itemGroup);
      });

      // Validate when reason changes
      itemGroup.get('reason')?.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.updateItemValidation(itemGroup, item);
      });

      // Validate when selected changes
      itemGroup.get('selected')?.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe((selected) => {
        if (selected) {
          this.updateItemValidation(itemGroup, item);
        }
      });

      itemsArray.push(itemGroup);
    });
  }

  private updateItemValidation(itemGroup: FormGroup, item: AvailableReturnItem): void {
    const quantity = itemGroup.get('returnQuantity')?.value || 0;
    const selected = itemGroup.get('selected')?.value;
    const reason = itemGroup.get('reason')?.value;
    const errors: string[] = [];

    // Only validate if item is selected
    if (selected) {
      // Check if quantity is valid
      const quantityControl = itemGroup.get('returnQuantity');
      if (quantityControl?.errors) {
        Object.keys(quantityControl.errors).forEach(errorKey => {
          const error = quantityControl.errors![errorKey];
          if (error.message) {
            errors.push(error.message);
          }
        });
      }

      // Check if reason is selected when quantity > 0
      if (quantity > 0 && !reason) {
        errors.push('Return reason is required');
      }

      // Check stock availability
      if (quantity > item.currentStock) {
        errors.push(`Insufficient stock. Available: ${item.currentStock}`);
      }

      // Check available return quantity
      if (quantity > item.availableForReturn) {
        errors.push(`Exceeds available return quantity: ${item.availableForReturn}`);
      }
    }

    // Update validation errors for display
    itemGroup.patchValue({ validationErrors: errors }, { emitEvent: false });
  }

  private updateItemTotal(itemGroup: FormGroup): void {
    const quantity = itemGroup.get('returnQuantity')?.value || 0;
    const unitPrice = itemGroup.get('unitPrice')?.value || 0;
    const total = quantity * unitPrice;
    
    // You can add a total field to the form group if needed
    // itemGroup.patchValue({ total: total }, { emitEvent: false });
  }

  selectPurchaseOrder(purchaseOrder: PurchaseOrder): void {
    this.showSearchDropdown.set(false);
    this.purchaseOrderSearchResults.set([]);
    this.returnForm.patchValue({
      purchaseOrderSearch: purchaseOrder.poNumber
    });
    this.loadPurchaseOrderForReturn(purchaseOrder.id);
  }

  onSubmit(): void {
    if (this.returnForm.invalid) {
      this.markFormGroupTouched(this.returnForm);
      this.error.set('Please fill in all required fields correctly.');
      return;
    }

    // Get validation summary
    const validationErrors = this.getFormValidationSummary();
    if (validationErrors.length > 0) {
      this.error.set(`Validation errors: ${validationErrors.join('; ')}`);
      return;
    }

    const selectedItems = this.itemsFormArray.controls
      .filter(control => control.get('selected')?.value && control.get('returnQuantity')?.value > 0)
      .map(control => ({
        purchaseOrderItemId: control.get('purchaseOrderItemId')?.value,
        productId: control.get('productId')?.value,
        returnQuantity: control.get('returnQuantity')?.value,
        unitPrice: control.get('unitPrice')?.value,
        reason: parseInt(control.get('reason')?.value || '6'), // Convert to number, default to Other
        reasonDescription: control.get('reasonDescription')?.value || null,
        refundRequested: control.get('refundRequested')?.value
      } as CreatePurchaseOrderReturnItem));

    if (selectedItems.length === 0) {
      this.error.set('Please select at least one item to return with a quantity greater than 0.');
      return;
    }

    const request: CreatePurchaseOrderReturnRequest = {
      purchaseOrderId: this.returnForm.get('purchaseOrderId')?.value,
      supplierId: this.selectedPurchaseOrder()?.supplierId || '',
      notes: this.returnForm.get('notes')?.value || '',
      items: selectedItems
    };

    this.saving.set(true);
    this.error.set(null);

    // Debug: Log the request being sent
    console.log('Sending request:', JSON.stringify(request, null, 2));

    this.returnService.createReturn(request).pipe(
      catchError(error => {
        console.error('Error creating return:', error);
        let errorMessage = 'Failed to create return. Please try again.';
        
        // Handle specific backend validation errors
        if (error?.error?.error && typeof error.error.error === 'string') {
          errorMessage = error.error.error;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        this.error.set(errorMessage);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.saving.set(false);
      if (result?.data) {
        this.success.set('Return created successfully!');
        setTimeout(() => {
          this.router.navigate(['/dashboard/supply-chain/purchase-order-returns', result.data!.id]);
        }, 1500);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }

  toggleItemSelection(index: number): void {
    // No need to manually toggle since the checkbox formControlName handles this
    // This method can be used for any additional logic when selection changes
    const item = this.itemsFormArray.at(index);
    const isSelected = item.get('selected')?.value;
    
    // If item is deselected, clear the return quantity and reason
    if (!isSelected) {
      item.patchValue({
        returnQuantity: 0,
        reason: '',
        reasonDescription: '',
        refundRequested: false
      });
    }
  }

  selectAllItems(): void {
    this.itemsFormArray.controls.forEach(control => {
      control.patchValue({ selected: true });
    });
  }

  deselectAllItems(): void {
    this.itemsFormArray.controls.forEach(control => {
      control.patchValue({ selected: false });
    });
  }

  getSelectedItemsCount(): number {
    return this.itemsFormArray.controls.filter(control => control.get('selected')?.value).length;
  }

  getTotalReturnAmount(): number {
    return this.itemsFormArray.controls
      .filter(control => control.get('selected')?.value)
      .reduce((total, control) => {
        const quantity = control.get('returnQuantity')?.value || 0;
        const unitPrice = control.get('unitPrice')?.value || 0;
        return total + (quantity * unitPrice);
      }, 0);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/supply-chain/purchase-order-returns']);
  }

  clearError(): void {
    this.error.set(null);
  }

  clearSuccess(): void {
    this.success.set(null);
  }

  hideSearchDropdown(): void {
    // Add small delay to allow click events to process
    setTimeout(() => {
      this.showSearchDropdown.set(false);
    }, 150);
  }

  onSearchInputFocus(): void {
    if (this.purchaseOrderSearchResults().length > 0) {
      this.showSearchDropdown.set(true);
    }
  }

  clearSearch(): void {
    this.returnForm.patchValue({ purchaseOrderSearch: '' });
    this.purchaseOrderSearchResults.set([]);
    this.showSearchDropdown.set(false);
    this.selectedPurchaseOrder.set(null);
    this.availableItems.set([]);
    this.itemsFormArray.clear();
  }

  // Validation helper methods
  getItemValidationErrors(index: number): string[] {
    const item = this.itemsFormArray.at(index);
    return item.get('validationErrors')?.value || [];
  }

  hasValidationErrors(index: number): boolean {
    return this.getItemValidationErrors(index).length > 0;
  }

  isItemValid(index: number): boolean {
    const item = this.itemsFormArray.at(index);
    const selected = item.get('selected')?.value;
    const quantity = item.get('returnQuantity')?.value;
    const reason = item.get('reason')?.value;
    
    if (!selected) return true;
    if (quantity <= 0) return false;
    if (!reason) return false;
    
    return !this.hasValidationErrors(index);
  }

  getFormValidationSummary(): string[] {
    const errors: string[] = [];
    
    // Check if any items selected
    const selectedItems = this.itemsFormArray.controls.filter(control => 
      control.get('selected')?.value && control.get('returnQuantity')?.value > 0
    );
    
    if (selectedItems.length === 0) {
      errors.push('Please select at least one item to return with a quantity greater than 0');
    }
    
    // Check individual item validation
    this.itemsFormArray.controls.forEach((control, index) => {
      if (control.get('selected')?.value) {
        const itemErrors = this.getItemValidationErrors(index);
        if (itemErrors.length > 0) {
          const productName = control.get('productName')?.value;
          errors.push(`${productName}: ${itemErrors.join(', ')}`);
        }
      }
    });
    
    return errors;
  }
}

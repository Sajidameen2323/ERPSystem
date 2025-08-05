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

  // Custom validator for selected items only
  static conditionalRequiredValidator(dependentField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) {
        return null;
      }
      
      const selected = control.parent.get(dependentField)?.value;
      const returnQuantity = control.parent.get('returnQuantity')?.value;
      
      // Only require validation if item is selected and has a return quantity > 0
      if (selected && returnQuantity > 0) {
        const value = control.value;
        // Check for null, undefined, or empty string - but allow 0 (which is a valid reason value for "Damaged")
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
          return { conditionalRequired: true };
        }
      }
      
      return null;
    };
  }

  // Removed stockAvailabilityValidator as we only need to validate against purchase order quantities, not overall stock

  ngOnInit(): void {
    this.initializeForm();
    
    // Check if purchase order ID is provided in route first
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['purchaseOrderId']) {
        // Pre-loading mode - don't setup search functionality
        this.loadPurchaseOrderForReturn(params['purchaseOrderId']);
      } else {
        // Normal mode - setup search functionality
        this.setupPurchaseOrderSearch();
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
          searchTerm: searchTerm
          // Allow returns from Received, PartiallyReceived, and PartiallyReturned orders
          // Backend will filter eligible orders based on business rules
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
            this.error.set('No eligible purchase orders found matching your search.');
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

  // Safe tracking function for form controls
  trackByItemId = (index: number, itemControl: AbstractControl): string => {
    const purchaseOrderItemId = itemControl.get('purchaseOrderItemId')?.value;
    const productId = itemControl.get('productId')?.value;
    
    // Create a safe unique identifier
    if (purchaseOrderItemId && productId) {
      return `${purchaseOrderItemId}_${productId}`;
    }
    
    // Fallback to index if IDs are not available
    return `item_${index}`;
  }

  private loadPurchaseOrderForReturn(purchaseOrderId: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Load purchase order details
    this.purchaseOrderService.getPurchaseOrder(purchaseOrderId).pipe(
      switchMap(poResult => {
        if (poResult) {
          this.selectedPurchaseOrder.set(poResult);
          
          // Pre-populate the form with purchase order details
          this.returnForm.patchValue({
            purchaseOrderId: purchaseOrderId,
            purchaseOrderSearch: `${poResult.poNumber} - ${poResult.supplier?.name || 'N/A'}`
          });
          
          // Hide search dropdown since we have a direct selection
          this.showSearchDropdown.set(false);
          this.purchaseOrderSearchResults.set([]);
          
          // Load available items for return
          return this.returnService.getAvailableReturnItems(purchaseOrderId);
        }
        throw new Error('Purchase order not found');
      }),
      catchError(error => {
        console.error('Error loading purchase order:', error);
        this.error.set('Failed to load purchase order details. Please check if the purchase order exists and is eligible for returns.');
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.loading.set(false);
      if (result?.data) {
        this.availableItems.set(result.data);
        this.populateAvailableItems(result.data);
        
        // Show success message when pre-loading from URL parameter
        if (this.route.snapshot.queryParams['purchaseOrderId']) {
          this.success.set(`Purchase order ${this.selectedPurchaseOrder()?.poNumber} loaded successfully. Select items to return below.`);
          
          // Clear success message after a few seconds
          setTimeout(() => {
            this.success.set(null);
          }, 4000);
        }
      } else if (result === null) {
        // This means the purchase order was found but has no returnable items
        this.error.set('This purchase order has no items available for return. All items may have already been returned or the order may not be in a returnable status.');
      }
    });
  }

  private populateAvailableItems(items: AvailableReturnItem[]): void {
    const itemsArray = this.itemsFormArray;
    itemsArray.clear();

    items.forEach(item => {
      const validators = [
        ReturnFormComponent.positiveQuantityValidator(),
        ReturnFormComponent.maxReturnQuantityValidator(item.availableForReturn)
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
        reason: ['', ReturnFormComponent.conditionalRequiredValidator('selected')],
        reasonDescription: [''],
        refundRequested: [false],
        selected: [false],
        validationErrors: [{ value: [], disabled: true }] // Track validation errors for display
      });

      // Real-time validation with enhanced feedback
      itemGroup.get('returnQuantity')?.valueChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe((quantity) => {
        // Trigger validation on reason field when quantity changes
        const reasonControl = itemGroup.get('reason');
        reasonControl?.updateValueAndValidity();
        
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
        // Trigger validation on reason field when selection changes
        const reasonControl = itemGroup.get('reason');
        reasonControl?.updateValueAndValidity();
        
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

      // Check available return quantity (this is the key validation - based on PO received quantity)
      if (quantity > item.availableForReturn) {
        errors.push(`Exceeds available return quantity: ${item.availableForReturn}`);
      }

      // Note: We removed stock validation as returns should be based on PO quantities, not overall stock
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
    console.log('Submitting return form:', this.returnForm.value);
    // Get validation summary first
    const validationErrors = this.getFormValidationSummary();
    if (validationErrors.length > 0) {
      this.error.set(`Please fix the following issues: ${validationErrors.join('; ')}`);
      return;
    }

    // Check for selected items with proper validation
    const selectedItems = this.itemsFormArray.controls
      .filter(control => {
        const selected = control.get('selected')?.value;
        const quantity = control.get('returnQuantity')?.value;
        return selected && quantity > 0;
      })
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

    // Additional validation: ensure all selected items have valid quantities and reasons
    const invalidItems = selectedItems.filter(item => {
      return item.returnQuantity <= 0 || item.reason === null || item.reason === undefined;
    });

    if (invalidItems.length > 0) {
      this.error.set('All selected items must have a valid return quantity and reason.');
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

  isFormValidForSubmission(): boolean {
    // Check if purchase order is selected
    if (!this.returnForm.get('purchaseOrderId')?.value) {
      return false;
    }

    // Check if at least one item is selected with valid data
    const selectedItems = this.itemsFormArray.controls.filter(control => {
      const selected = control.get('selected')?.value;
      const quantity = control.get('returnQuantity')?.value;
      return selected && quantity > 0;
    });

    if (selectedItems.length === 0) {
      return false;
    }

    // Check if all selected items are valid
    return selectedItems.every((control, index) => {
      const formIndex = this.itemsFormArray.controls.indexOf(control);
      return this.isItemValid(formIndex);
    });
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
    
    // If not selected, it's always valid (no validation needed)
    if (!selected) return true;
    
    // If selected, check if quantity > 0 and reason is provided
    if (quantity <= 0) return false;
    if (reason === null || reason === undefined || reason === '') return false;
    
    // Check for validation errors
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
    
    // Check individual item validation for selected items only
    this.itemsFormArray.controls.forEach((control, index) => {
      const selected = control.get('selected')?.value;
      const quantity = control.get('returnQuantity')?.value;
      
      if (selected && quantity > 0) {
        const itemErrors = this.getItemValidationErrors(index);
        if (itemErrors.length > 0) {
          const productName = control.get('productName')?.value;
          errors.push(`${productName}: ${itemErrors.join(', ')}`);
        }
      }
    });
    
    return errors;
  }

  getStatusText(status: PurchaseOrderStatus): string {
    switch (status) {
      case PurchaseOrderStatus.Draft:
        return 'Draft';
      case PurchaseOrderStatus.Pending:
        return 'Pending';
      case PurchaseOrderStatus.Approved:
        return 'Approved';
      case PurchaseOrderStatus.Sent:
        return 'Sent';
      case PurchaseOrderStatus.PartiallyReceived:
        return 'Partially Received';
      case PurchaseOrderStatus.Received:
        return 'Received';
      case PurchaseOrderStatus.PartiallyReturned:
        return 'Partially Returned';
      case PurchaseOrderStatus.Returned:
        return 'Returned';
      case PurchaseOrderStatus.Cancelled:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }
}

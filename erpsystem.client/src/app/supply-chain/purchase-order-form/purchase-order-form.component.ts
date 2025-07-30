import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { LucideAngularModule, Save, ArrowLeft, Plus, Trash2, X } from 'lucide-angular';

import { PurchaseOrderService } from '../../shared/services/purchase-order.service';
import { SupplierService } from '../../shared/services/supplier.service';
import { ProductService } from '../../shared/services/product.service';
import { PurchaseOrder, PurchaseOrderCreate, PurchaseOrderUpdate } from '../../shared/models/purchase-order.interface';
import { Supplier } from '../../shared/models/supplier.interface';
import { Product } from '../../shared/models/product.interface';

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './purchase-order-form.component.html',
  styleUrl: './purchase-order-form.component.css'
})
export class PurchaseOrderFormComponent implements OnInit, OnDestroy {
  purchaseOrderForm: FormGroup;
  isEditing = false;
  purchaseOrderId: string | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  suppliers: Supplier[] = [];
  products: Product[] = [];
  private productsLoaded$ = new Subject<boolean>();

  // Icons
  readonly SaveIcon = Save;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly XIcon = X;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private purchaseOrderService: PurchaseOrderService,
    private supplierService: SupplierService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.purchaseOrderForm = this.createForm();
  }

  ngOnInit(): void {
    this.purchaseOrderId = this.route.snapshot.paramMap.get('id');
    this.isEditing = !!this.purchaseOrderId;

    this.loadSuppliers();
    this.loadProducts();

    if (this.isEditing && this.purchaseOrderId) {
      this.loadPurchaseOrder(this.purchaseOrderId);
    } else {
      // Add one empty item for new purchase orders
      this.addItem();
      
      // Check for pre-selected supplier and product from query params
      combineLatest([
        this.route.queryParams,
        this.productsLoaded$
      ]).pipe(takeUntil(this.destroy$)).subscribe(([params, productsLoaded]) => {
        if (params['supplierId']) {
          this.purchaseOrderForm.patchValue({
            supplierId: params['supplierId']
          });
        }
        
        // Preselect product if productId is provided and products are loaded
        if (params['productId'] && this.itemsFormArray.length > 0 && productsLoaded) {
          const firstItem = this.itemsFormArray.at(0);
          firstItem.patchValue({
            productId: params['productId']
          });
          // Trigger product change to set unit price
          this.onProductChange(0);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.productsLoaded$.complete();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      supplierId: ['', [Validators.required]],
      expectedDeliveryDate: [''],
      notes: ['', [Validators.maxLength(1000)]],
      items: this.formBuilder.array([])
    });
  }

  get itemsFormArray(): FormArray {
    return this.purchaseOrderForm.get('items') as FormArray;
  }

  private createItemForm(): FormGroup {
    return this.formBuilder.group({
      productId: ['', [Validators.required]],
      orderedQuantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  loadSuppliers(): void {
    this.supplierService.getActiveSuppliersForSelection()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (suppliers) => {
          this.suppliers = suppliers;
        },
        error: (error) => {
          console.error('Error loading suppliers:', error);
        }
      });
  }

  loadProducts(): void {
    this.productService.getProducts({
      page: 1,
      pageSize: 1000,
      sortBy: 'name',
      sortDirection: 'asc'
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.products = response.items;
          this.productsLoaded$.next(true);
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.productsLoaded$.next(false);
        }
      });
  }

  private loadPurchaseOrder(id: string): void {
    this.loading = true;
    this.error = null;

    this.purchaseOrderService.getPurchaseOrder(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (purchaseOrder) => {
          this.populateForm(purchaseOrder);
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load purchase order details. Please try again.';
          this.loading = false;
          console.error('Error loading purchase order:', error);
        }
      });
  }

  private populateForm(purchaseOrder: PurchaseOrder): void {
    this.purchaseOrderForm.patchValue({
      supplierId: purchaseOrder.supplierId,
      expectedDeliveryDate: purchaseOrder.expectedDeliveryDate ? 
        new Date(purchaseOrder.expectedDeliveryDate).toISOString().split('T')[0] : '',
      notes: purchaseOrder.notes
    });

    // Disable supplier field when editing (backend doesn't allow supplier change)
    this.purchaseOrderForm.get('supplierId')?.disable();

    // Clear existing items and add purchase order items
    this.itemsFormArray.clear();
    if (purchaseOrder.items) {
      purchaseOrder.items.forEach(item => {
        const itemForm = this.createItemForm();
        itemForm.patchValue({
          productId: item.productId,
          orderedQuantity: item.orderedQuantity,
          unitPrice: item.unitPrice,
          notes: item.notes
        });
        this.itemsFormArray.push(itemForm);
      });
    }
  }

  addItem(): void {
    this.itemsFormArray.push(this.createItemForm());
  }

  removeItem(index: number): void {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
    }
  }

  onProductChange(index: number): void {
    const itemForm = this.itemsFormArray.at(index);
    const productId = itemForm.get('productId')?.value;
    
    if (productId) {
      const product = this.products.find(p => p.id === productId);
      if (product) {
        itemForm.patchValue({
          unitPrice: product.costPrice || product.unitPrice
        });
      }
    }
  }

  calculateItemTotal(index: number): number {
    const itemForm = this.itemsFormArray.at(index);
    const orderedQuantity = itemForm.get('orderedQuantity')?.value || 0;
    const unitPrice = itemForm.get('unitPrice')?.value || 0;
    return orderedQuantity * unitPrice;
  }

  calculateGrandTotal(): number {
    let total = 0;
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      total += this.calculateItemTotal(i);
    }
    return total;
  }

  onSubmit(): void {
    if (this.purchaseOrderForm.valid) {
      if (this.isEditing && this.purchaseOrderId) {
        this.updatePurchaseOrder();
      } else {
        this.createPurchaseOrder();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private createPurchaseOrder(): void {
    this.saving = true;
    this.error = null;

    const formValue = this.purchaseOrderForm.value;
    const purchaseOrderData: PurchaseOrderCreate = {
      supplierId: formValue.supplierId,
      expectedDeliveryDate: formValue.expectedDeliveryDate ? new Date(formValue.expectedDeliveryDate) : undefined,
      notes: formValue.notes,
      items: formValue.items.map((item: any) => ({
        productId: item.productId,
        orderedQuantity: item.orderedQuantity,
        unitPrice: item.unitPrice,
        notes: item.notes
      }))
    };

    this.purchaseOrderService.createPurchaseOrder(purchaseOrderData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (purchaseOrder) => {
          this.saving = false;
          this.router.navigate(['/dashboard/supply-chain/purchase-orders']);
        },
        error: (error) => {
          this.error = 'Failed to create purchase order. Please try again.';
          this.saving = false;
          console.error('Error creating purchase order:', error);
        }
      });
  }

  private updatePurchaseOrder(): void {
    if (!this.purchaseOrderId) return;

    this.saving = true;
    this.error = null;

    const formValue = this.purchaseOrderForm.value;
    const purchaseOrderData: PurchaseOrderUpdate = {
      expectedDeliveryDate: formValue.expectedDeliveryDate ? new Date(formValue.expectedDeliveryDate) : undefined,
      notes: formValue.notes,
      items: formValue.items.map((item: any) => ({
        productId: item.productId,
        orderedQuantity: item.orderedQuantity,
        unitPrice: item.unitPrice,
        notes: item.notes
      }))
    };

    this.purchaseOrderService.updatePurchaseOrder(this.purchaseOrderId, purchaseOrderData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (purchaseOrder) => {
          this.saving = false;
          this.router.navigate(['/dashboard/supply-chain/purchase-orders']);
        },
        error: (error) => {
          this.error = 'Failed to update purchase order. Please try again.';
          this.saving = false;
          console.error('Error updating purchase order:', error);
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.purchaseOrderForm.controls).forEach(key => {
      const control = this.purchaseOrderForm.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormArray) {
        control.controls.forEach(item => {
          Object.keys((item as FormGroup).controls).forEach(itemKey => {
            (item as FormGroup).get(itemKey)?.markAsTouched();
          });
        });
      }
    });
  }

  isFieldInvalid(fieldName: string, index?: number): boolean {
    if (index !== undefined) {
      const itemForm = this.itemsFormArray.at(index);
      const field = itemForm.get(fieldName);
      return !!(field && field.invalid && (field.dirty || field.touched));
    } else {
      const field = this.purchaseOrderForm.get(fieldName);
      return !!(field && field.invalid && (field.dirty || field.touched));
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/supply-chain/purchase-orders']);
  }
}

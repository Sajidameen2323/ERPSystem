import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { Product, ProductCreate, ProductUpdate } from '../../shared/models/product.interface';
import { LucideAngularModule, Save, ArrowLeft, Package } from 'lucide-angular';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Lucide icons
  readonly Save = Save;
  readonly ArrowLeft = ArrowLeft;
  readonly Package = Package;

  // Signals for reactive state management
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  isEditMode = signal(false);
  productId = signal<string | null>(null);

  // Form
  productForm: FormGroup;

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      sku: ['', [Validators.required, Validators.maxLength(50)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      currentStock: [0, [Validators.required, Validators.min(0)]],
      minimumStock: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.productId.set(params['id']);
        this.loadProduct(params['id']);
      }
    });
  }

  private loadProduct(id: string) {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getProduct(id).pipe(
      catchError(error => {
        this.error.set('Failed to load product. Please try again.');
        console.error('Error loading product:', error);
        return of(null);
      })
    ).subscribe((product: Product | null) => {
      if (product) {
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          sku: product.sku,
          unitPrice: product.unitPrice,
          costPrice: product.costPrice,
          currentStock: product.currentStock,
          minimumStock: product.minimumStock
        });
      }
      this.loading.set(false);
    });
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.saving.set(true);
      this.error.set(null);

      const formValue = this.productForm.value;

      if (this.isEditMode()) {
        const updateDto: ProductUpdate = {
          name: formValue.name,
          description: formValue.description,
          unitPrice: formValue.unitPrice,
          costPrice: formValue.costPrice,
          minimumStock: formValue.minimumStock
        };

        this.productService.updateProduct(this.productId()!, updateDto).pipe(
          catchError(error => {
            this.error.set('Failed to update product. Please try again.');
            console.error('Error updating product:', error);
            return of(null);
          })
        ).subscribe(result => {
          this.saving.set(false);
          if (result) {
            this.router.navigate(['/dashboard/inventory/products']);
          }
        });
      } else {
        const createDto: ProductCreate = {
          name: formValue.name,
          sku: formValue.sku,
          description: formValue.description,
          unitPrice: formValue.unitPrice,
          costPrice: formValue.costPrice,
          currentStock: formValue.currentStock,
          minimumStock: formValue.minimumStock
        };

        this.productService.createProduct(createDto).pipe(
          catchError(error => {
            this.error.set('Failed to create product. Please try again.');
            console.error('Error creating product:', error);
            return of(null);
          })
        ).subscribe(result => {
          this.saving.set(false);
          if (result) {
            this.router.navigate(['/dashboard/inventory/products']);
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.router.navigate(['/dashboard/inventory/products']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} is too long`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} must be greater than or equal to ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Product Name',
      description: 'Description',
      sku: 'SKU',
      unitPrice: 'Unit Price',
      costPrice: 'Cost Price',
      currentStock: 'Current Stock',
      minimumStock: 'Minimum Stock'
    };
    return labels[fieldName] || fieldName;
  }
}

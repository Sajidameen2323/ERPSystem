import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule, Save, ArrowLeft, X } from 'lucide-angular';

import { SupplierService } from '../../shared/services/supplier.service';
import { Supplier, SupplierCreate, SupplierUpdate } from '../../shared/models/supplier.interface';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.css'
})
export class SupplierFormComponent implements OnInit, OnDestroy {
  supplierForm: FormGroup;
  isEditing = false;
  supplierId: string | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  // Icons
  readonly SaveIcon = Save;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly XIcon = X;

  // Countries for dropdown
  countries = [
    'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 
    'Italy', 'Spain', 'Netherlands', 'Australia', 'Japan', 'China', 'India',
    'Brazil', 'Mexico', 'South Korea', 'Sweden', 'Norway', 'Denmark',
    'Switzerland', 'Belgium', 'Austria', 'Ireland', 'New Zealand'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private supplierService: SupplierService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.supplierForm = this.createForm();
  }

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    this.isEditing = !!this.supplierId;

    if (this.isEditing && this.supplierId) {
      this.loadSupplier(this.supplierId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      contactPerson: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phone: ['', [Validators.required, Validators.maxLength(20)]],
      address: ['', [Validators.required, Validators.maxLength(500)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      country: ['', [Validators.required, Validators.maxLength(100)]],
      postalCode: ['', [Validators.maxLength(20)]],
      vatNumber: ['', [Validators.maxLength(50)]],
      paymentTerms: ['', [Validators.maxLength(100)]],
      creditLimit: [null, [Validators.min(0)]]
    });
  }

  private loadSupplier(id: string): void {
    this.loading = true;
    this.error = null;

    this.supplierService.getSupplier(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (supplier) => {
          this.populateForm(supplier);
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load supplier details. Please try again.';
          this.loading = false;
          console.error('Error loading supplier:', error);
        }
      });
  }

  private populateForm(supplier: Supplier): void {
    this.supplierForm.patchValue({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      country: supplier.country,
      postalCode: supplier.postalCode,
      vatNumber: supplier.vatNumber,
      paymentTerms: supplier.paymentTerms,
      creditLimit: supplier.creditLimit
    });
  }

  onSubmit(): void {
    if (this.supplierForm.valid) {
      if (this.isEditing && this.supplierId) {
        this.updateSupplier();
      } else {
        this.createSupplier();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private createSupplier(): void {
    this.saving = true;
    this.error = null;

    const supplierData: SupplierCreate = this.supplierForm.value;

    this.supplierService.createSupplier(supplierData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (supplier) => {
          this.saving = false;
          this.router.navigate(['/dashboard/supply-chain/suppliers']);
        },
        error: (error) => {
          this.error = 'Failed to create supplier. Please try again.';
          this.saving = false;
          console.error('Error creating supplier:', error);
        }
      });
  }

  private updateSupplier(): void {
    if (!this.supplierId) return;

    this.saving = true;
    this.error = null;

    const supplierData: SupplierUpdate = this.supplierForm.value;

    this.supplierService.updateSupplier(this.supplierId, supplierData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (supplier) => {
          this.saving = false;
          this.router.navigate(['/dashboard/supply-chain/suppliers']);
        },
        error: (error) => {
          this.error = 'Failed to update supplier. Please try again.';
          this.saving = false;
          console.error('Error updating supplier:', error);
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.supplierForm.controls).forEach(key => {
      const control = this.supplierForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.supplierForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.supplierForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} is too long`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} must be greater than or equal to 0`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Supplier name',
      contactPerson: 'Contact person',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      city: 'City',
      country: 'Country',
      postalCode: 'Postal code',
      vatNumber: 'VAT number',
      paymentTerms: 'Payment terms',
      creditLimit: 'Credit limit'
    };
    return labels[fieldName] || fieldName;
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/supply-chain/suppliers']);
  }
}

import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { UserService } from '../../../../core/services/user.service';
import { User, UpdateUserRequest } from '../../../../core/models/user.interface';

interface UpdateUserForm {
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    displayName: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
}

@Component({
    selector: 'app-update-user-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './update-user-modal.component.html',
    styleUrls: ['./update-user-modal.component.css']
})
export class UpdateUserModalComponent implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly userService = inject(UserService);
    private readonly destroy$ = new Subject<void>();

    @Input() userId!: string;
    @Input() isVisible: boolean = false;
    @Output() userUpdated = new EventEmitter<User>();
    @Output() cancelled = new EventEmitter<void>();

    // Signals for reactive state management
    readonly originalUser = signal<User | null>(null);
    readonly availableRoles = signal<string[]>([]);
    readonly selectedRoles = signal<string[]>([]);
    readonly isLoading = signal<boolean>(false);
    readonly isSubmitting = signal<boolean>(false);
    readonly errorMessage = signal<string>('');

    // Typed reactive form
    readonly updateForm = this.fb.group<UpdateUserForm>({
        firstName: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
        lastName: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
        displayName: this.fb.nonNullable.control('', [Validators.maxLength(100)]),
        password: this.fb.nonNullable.control('', [Validators.minLength(8), Validators.maxLength(100)]),
        confirmPassword: this.fb.nonNullable.control('')
    }, {
        validators: this.passwordMatchValidator
    });

  // Computed properties
  readonly formValid = computed(() => this.updateForm.valid);
  readonly userDisplayName = computed(() => {
    const user = this.originalUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

    constructor() {
        // Effect to handle modal visibility changes
        effect(() => {
            if (this.isVisible && this.userId) {
                this.loadUserData();
                this.loadAvailableRoles();
            }
        }, { allowSignalWrites: true });
    }

    ngOnInit(): void {
        // Lifecycle handled by effect
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password');
        const confirmPassword = control.get('confirmPassword');

        if (!password || !confirmPassword) {
            return null;
        }

        if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
            return { passwordMismatch: true };
        }

        return null;
    }

    private loadUserData(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.userService.getUserById(this.userId)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isLoading.set(false))
            )
            .subscribe({
                next: (response) => {
                    if (response.isSuccess && response.data) {
                        this.originalUser.set(response.data);
                        this.selectedRoles.set(response.data.roles ? [...response.data.roles] : []);
                        this.populateForm(response.data);
                    } else {
                        this.errorMessage.set(response.error || 'Failed to load user data');
                    }
                },
                error: (error) => {
                    console.error('Error loading user:', error);
                    this.errorMessage.set('Failed to load user data');
                }
            });
    }

    private loadAvailableRoles(): void {
        this.userService.getRoles()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.isSuccess && response.data) {
                        this.availableRoles.set(response.data);
                    } else {
                        console.error('Failed to load roles:', response.error);
                    }
                },
                error: (error) => {
                    console.error('Error loading roles:', error);
                }
            });
    }

    private populateForm(user: User): void {
        // Create display name from first and last name if not provided
        const displayName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim();

        this.updateForm.patchValue({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            displayName: displayName,
            password: '',
            confirmPassword: ''
        });

        // Mark form as pristine after population
        this.updateForm.markAsPristine();
    }

    onSubmit(): void {
        if (!this.updateForm.valid) {
            this.markFormGroupTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set('');

        const formValue = this.updateForm.value;
        const updateRequest: UpdateUserRequest = {
            firstName: formValue.firstName!,
            lastName: formValue.lastName!,
            displayName: formValue.displayName || undefined,
            password: formValue.password || undefined,
            roles: this.selectedRoles().length > 0 ? this.selectedRoles() : undefined
        };

        this.userService.updateUser(this.userId, updateRequest)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isSubmitting.set(false))
            )
            .subscribe({
                next: (response) => {
                    if (response.isSuccess && response.data) {
                        this.userUpdated.emit(response.data);
                        this.onCancel();
                    } else {
                        this.errorMessage.set(response.error || 'Failed to update user');
                    }
                },
                error: (error) => {
                    console.error('Error updating user:', error);
                    this.errorMessage.set(error.error?.message || 'Failed to update user');
                }
            });
    }

    onCancel(): void {
        this.cancelled.emit();
        this.resetForm();
    }

    onBackdropClick(event: Event): void {
        if (event.target === event.currentTarget) {
            this.onCancel();
        }
    }

    onRoleChange(event: Event, role: string): void {
        const checkbox = event.target as HTMLInputElement;
        const currentRoles = this.selectedRoles();

        if (checkbox.checked) {
            if (!currentRoles.includes(role)) {
                this.selectedRoles.set([...currentRoles, role]);
            }
        } else {
            this.selectedRoles.set(currentRoles.filter(r => r !== role));
        }
    }

    isRoleSelected(role: string): boolean {
        return this.selectedRoles().includes(role);
    }

    isFieldInvalid(fieldName: keyof UpdateUserForm): boolean {
        const field = this.updateForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    getFieldError(fieldName: keyof UpdateUserForm): string {
        const field = this.updateForm.get(fieldName);
        if (!field || !field.errors || !field.touched) {
            return '';
        }

        const errors = field.errors;
        if (errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
        if (errors['maxlength']) return `${this.getFieldDisplayName(fieldName)} is too long`;
        if (errors['minlength']) return `${this.getFieldDisplayName(fieldName)} is too short`;
        if (errors['passwordMismatch']) return 'Passwords do not match';

        return 'Invalid input';
    }

    private getFieldDisplayName(fieldName: keyof UpdateUserForm): string {
        const displayNames: Record<keyof UpdateUserForm, string> = {
            firstName: 'First name',
            lastName: 'Last name',
            displayName: 'Display name',
            password: 'Password',
            confirmPassword: 'Confirm password'
        };
        return displayNames[fieldName];
    }

  getStatusClass(status?: string): string {
    if (!status) return '';
    
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded';
      case 'deprovisioned':
      case 'suspended':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded';
      case 'staged':
      case 'provisioned':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded';
    }
  }

    private markFormGroupTouched(): void {
        Object.keys(this.updateForm.controls).forEach(key => {
            const control = this.updateForm.get(key);
            control?.markAsTouched();
        });
    }

    private resetForm(): void {
        this.updateForm.reset();
        this.originalUser.set(null);
        this.selectedRoles.set([]);
        this.errorMessage.set('');
        this.isLoading.set(false);
        this.isSubmitting.set(false);
    }
}

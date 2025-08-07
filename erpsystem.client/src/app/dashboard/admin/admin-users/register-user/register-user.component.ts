import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, UserPlus, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-angular';
import { UserService } from '../../../../core/services/user.service';
import { RegisterUserRequest } from '../../../../core/models/user.interface';

@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.css'
})
export class RegisterUserComponent implements OnInit {
  readonly icons = {
    UserPlus,
    ArrowLeft,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle
  };

  registerForm!: FormGroup;
  availableRoles: string[] = [];
  loading = false;
  submitting = false;
  error: string | null = null;
  success: string | null = null;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadAvailableRoles();
  }

  private initializeForm() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]],
      roles: [[], [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  private loadAvailableRoles() {
    this.loading = true;
    this.userService.getRoles().subscribe({
      next: (result) => {
        this.loading = false;
        if (result.isSuccess && result.data) {
          this.availableRoles = result.data;
        } else {
          this.error = 'Failed to load available roles';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to load roles: ' + (error.error?.message || error.message);
      }
    });
  }

  toggleRole(role: string) {
    const rolesControl = this.registerForm.get('roles');
    const currentRoles = rolesControl?.value || [];
    
    if (currentRoles.includes(role)) {
      rolesControl?.setValue(currentRoles.filter((r: string) => r !== role));
    } else {
      rolesControl?.setValue([...currentRoles, role]);
    }
  }

  isRoleSelected(role: string): boolean {
    const roles = this.registerForm.get('roles')?.value || [];
    return roles.includes(role);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    this.error = null;
    this.success = null;

    const formValue = this.registerForm.value;
    const registerRequest: RegisterUserRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      roles: formValue.roles
    };

    this.userService.registerUser(registerRequest).subscribe({
      next: (result) => {
        this.submitting = false;
        if (result.isSuccess) {
          this.success = 'User registered successfully! They will receive an email with login instructions.';
          this.registerForm.reset();
          this.registerForm.get('roles')?.setValue([]);
          
          // Navigate back to users list after a delay
          setTimeout(() => {
            this.router.navigate(['/dashboard/admin/users']);
          }, 2000);
        } else {
          this.error = result.message || result.error || 'Failed to register user';
        }
      },
      error: (error) => {
        this.submitting = false;
        this.error = 'Registration failed: ' + (error.error?.message || error.message);
      }
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `${fieldName} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
      if (field.errors['pattern']) return 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character';
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
    }
    return null;
  }

  navigateBack() {
    this.router.navigate(['/dashboard/admin/users']);
  }

  getRoleBadgeClass(role: string): string {
    const roleClasses: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800 border-red-200',
      'salesuser': 'bg-blue-100 text-blue-800 border-blue-200',
      'inventoryuser': 'bg-green-100 text-green-800 border-green-200'
    };
    return roleClasses[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

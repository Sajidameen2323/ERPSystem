import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, User, Mail, Shield, ArrowLeft, Save, Power, Trash2, CheckCircle, XCircle } from 'lucide-angular';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';
import { UserManagement, RoleAssignmentRequest } from '../../../core/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css'
})
export class UserEditComponent implements OnInit {
  userForm!: FormGroup;
  user: UserManagement | null = null;
  availableRoles: string[] = [];
  isLoading = true;
  isSubmitting = false;
  userId: string = '';

  // Icons
  readonly userIcon = User;
  readonly mailIcon = Mail;
  readonly shieldIcon = Shield;
  readonly arrowLeftIcon = ArrowLeft;
  readonly saveIcon = Save;
  readonly powerIcon = Power;
  readonly trashIcon = Trash2;
  readonly checkIcon = CheckCircle;
  readonly xIcon = XCircle;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService,
    public loadingService: LoadingService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['id'];
    if (!this.userId) {
      this.toastService.error('Error', 'User ID is required');
      this.router.navigate(['/users']);
      return;
    }

    this.loadData();
  }

  private initializeForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      isActive: [true],
      roles: this.fb.array([])
    });
  }

  private loadData(): void {
    this.isLoading = true;
    
    // Load user data and available roles concurrently
    forkJoin({
      user: this.userService.getUserById(this.userId),
      roles: this.userService.getRoles()
    }).subscribe({
      next: (result) => {
        this.user = result.user;
        this.availableRoles = result.roles;
        this.populateForm();
        this.setupRoleCheckboxes();
        this.isLoading = false;
      },
      error: (error: any) => {
        this.toastService.error('Error', error.message || 'Failed to load data');
        this.router.navigate(['/users']);
        this.isLoading = false;
      }
    });
  }

  private async loadUser(): Promise<void> {
    // This method is no longer used, but keeping for backward compatibility
  }

  private async loadAvailableRoles(): Promise<void> {
    // This method is no longer used, but keeping for backward compatibility
  }

  private populateForm(): void {
    if (!this.user) return;

    this.userForm.patchValue({
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      phoneNumber: this.user.phoneNumber || '',
      isActive: this.user.isActive
    });
  }

  private setupRoleCheckboxes(): void {
    const rolesArray = this.userForm.get('roles') as FormArray;
    rolesArray.clear();

    this.availableRoles.forEach(role => {
      const isAssigned = this.user?.roles?.includes(role) || false;
      rolesArray.push(this.fb.control(isAssigned));
    });
  }

  get rolesArray(): FormArray {
    return this.userForm.get('roles') as FormArray;
  }

  onSubmit(): void {
    if (this.userForm.valid && this.user) {
      this.updateUserRoles();
    } else {
      this.markFormGroupTouched();
    }
  }

  private updateUserRoles(): void {
    if (!this.user) return;

    this.isSubmitting = true;
    const selectedRoles = this.getSelectedRoles();

    const roleRequest: RoleAssignmentRequest = {
      userId: this.user.id,
      roles: selectedRoles
    };

    this.userService.assignRoles(roleRequest).subscribe({
      next: () => {
        this.toastService.success('Success', 'User roles updated successfully');
        this.user!.roles = selectedRoles; // Update local user object
        this.isSubmitting = false;
      },
      error: (error: any) => {
        this.toastService.error('Error', error.message || 'Failed to update user roles');
        this.isSubmitting = false;
      }
    });
  }

  private getSelectedRoles(): string[] {
    const rolesFormArray = this.rolesArray;
    return this.availableRoles.filter((role, index) => rolesFormArray.at(index).value);
  }

  activateUser(): void {
    if (!this.user) return;

    this.loadingService.show();
    this.userService.activateUser(this.user.id).subscribe({
      next: () => {
        this.toastService.success('Success', 'User activated successfully');
        this.user!.isActive = true;
        this.userForm.patchValue({ isActive: true });
        this.loadingService.hide();
      },
      error: (error: any) => {
        this.toastService.error('Error', error.message || 'Failed to activate user');
        this.loadingService.hide();
      }
    });
  }

  deactivateUser(): void {
    if (!this.user) return;

    if (!confirm('Are you sure you want to deactivate this user? They will not be able to log in.')) {
      return;
    }

    this.loadingService.show();
    this.userService.deactivateUser({ userId: this.user.id }).subscribe({
      next: () => {
        this.toastService.success('Success', 'User deactivated successfully');
        this.user!.isActive = false;
        this.userForm.patchValue({ isActive: false });
        this.loadingService.hide();
      },
      error: (error: any) => {
        this.toastService.error('Error', error.message || 'Failed to deactivate user');
        this.loadingService.hide();
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(field => {
      const control = this.userForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  get canManageUser(): boolean {
    return this.authService.hasRole('Admin');
  }
}

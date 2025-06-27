import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormErrorHandlerService {

  /**
   * Maps backend validation errors to Angular form controls
   * @param form The Angular FormGroup
   * @param error The error response from backend
   * @returns whether any field-specific errors were mapped
   */
  mapServerErrorsToForm(form: FormGroup, error: any): boolean {
    let hasFieldErrors = false;

    // Handle ModelState errors (ASP.NET Core format)
    if (error.error && typeof error.error === 'object') {
      // Handle direct ModelState structure
      if (error.error.errors) {
        hasFieldErrors = this.processModelStateErrors(form, error.error.errors);
      }
      // Handle validation errors in different format
      else if (error.error.title === 'One or more validation errors occurred.' && error.error.errors) {
        hasFieldErrors = this.processModelStateErrors(form, error.error.errors);
      }
      // Handle single field errors
      else if (error.error.message && error.error.field) {
        this.setFieldError(form, error.error.field, error.error.message);
        hasFieldErrors = true;
      }
    }

    return hasFieldErrors;
  }

  /**
   * Processes ModelState errors from ASP.NET Core
   */
  private processModelStateErrors(form: FormGroup, errors: any): boolean {
    let hasFieldErrors = false;

    for (const fieldName in errors) {
      if (errors.hasOwnProperty(fieldName)) {
        const fieldErrors = errors[fieldName];
        const formFieldName = this.mapBackendFieldToFormField(fieldName);
        
        if (form.get(formFieldName)) {
          const errorMessage = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
          this.setFieldError(form, formFieldName, errorMessage);
          hasFieldErrors = true;
        }
      }
    }

    return hasFieldErrors;
  }

  /**
   * Maps backend field names to frontend form field names
   */
  private mapBackendFieldToFormField(backendFieldName: string): string {
    // Convert PascalCase to camelCase
    const camelCase = backendFieldName.charAt(0).toLowerCase() + backendFieldName.slice(1);
    
    // Handle specific field mappings if needed
    const fieldMappings: { [key: string]: string } = {
      'Email': 'email',
      'Password': 'password',
      'ConfirmPassword': 'confirmPassword',
      'FirstName': 'firstName',
      'LastName': 'lastName',
      'PhoneNumber': 'phoneNumber'
    };

    return fieldMappings[backendFieldName] || camelCase;
  }

  /**
   * Sets a server error on a specific form field
   */
  private setFieldError(form: FormGroup, fieldName: string, errorMessage: string): void {
    const control = form.get(fieldName);
    if (control) {
      // Get existing errors or create new object
      const currentErrors = control.errors || {};
      
      // Add server error
      currentErrors['serverError'] = errorMessage;
      
      // Set the errors
      control.setErrors(currentErrors);
      
      // Mark as touched to show the error
      control.markAsTouched();
    }
  }

  /**
   * Clears all server errors from the form
   */
  clearServerErrors(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control && control.errors) {
        delete control.errors['serverError'];
        
        // If no other errors, set to null
        if (Object.keys(control.errors).length === 0) {
          control.setErrors(null);
        }
      }
    });
  }

  /**
   * Gets a user-friendly error message for a form control
   */
  getErrorMessage(controlName: string, errors: any): string {
    if (!errors) return '';

    // Server errors take precedence
    if (errors['serverError']) {
      return errors['serverError'];
    }

    // Client-side validation errors
    const errorMessages: { [key: string]: { [key: string]: string } } = {
      firstName: {
        required: 'First name is required',
        minlength: 'First name must be at least 2 characters',
        maxlength: 'First name cannot exceed 50 characters'
      },
      lastName: {
        required: 'Last name is required',
        minlength: 'Last name must be at least 2 characters',
        maxlength: 'Last name cannot exceed 50 characters'
      },
      email: {
        required: 'Email is required',
        email: 'Please enter a valid email address'
      },
      password: {
        required: 'Password is required',
        minlength: 'Password must be at least 8 characters long',
        maxlength: 'Password cannot exceed 100 characters',
        pattern: 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character'
      },
      confirmPassword: {
        required: 'Please confirm your password',
        passwordMismatch: 'Passwords do not match'
      }
    };

    const fieldMessages = errorMessages[controlName];
    if (fieldMessages) {
      for (const errorType in errors) {
        if (fieldMessages[errorType]) {
          return fieldMessages[errorType];
        }
      }
    }

    // Fallback to generic error message
    return 'This field is invalid';
  }
}

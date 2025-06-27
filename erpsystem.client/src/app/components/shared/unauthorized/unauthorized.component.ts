import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, AlertTriangle } from 'lucide-angular';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 text-center">
        <div>
          <div class="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <lucide-icon [img]="alertIcon" class="h-8 w-8 text-red-600"></lucide-icon>
          </div>
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            Unauthorized Access
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            You don't have permission to access this resource.
          </p>
        </div>
        
        <div class="mt-8">
          <button
            routerLink="/dashboard"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  `
})
export class UnauthorizedComponent {
  readonly alertIcon = AlertTriangle;
}

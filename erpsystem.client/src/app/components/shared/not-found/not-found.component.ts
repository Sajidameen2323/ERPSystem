import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, FileQuestion } from 'lucide-angular';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 text-center">
        <div>
          <div class="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
            <lucide-icon [img]="fileQuestionIcon" class="h-8 w-8 text-gray-600"></lucide-icon>
          </div>
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            Page Not Found
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Sorry, we couldn't find the page you're looking for.
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
export class NotFoundComponent {
  readonly fileQuestionIcon = FileQuestion;
}

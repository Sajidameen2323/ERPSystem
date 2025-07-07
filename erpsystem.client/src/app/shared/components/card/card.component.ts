import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
         [class]="cardClass">
      
      <!-- Header -->
      <div *ngIf="title || headerIcon" 
           class="px-6 py-4 border-b border-gray-200"
           [class]="headerClass">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <lucide-angular *ngIf="headerIcon" 
                            [img]="headerIcon" 
                            [class]="iconClass || 'w-5 h-5 text-gray-600 mr-2'"></lucide-angular>
            <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
          </div>
          <div *ngIf="showActions" class="flex items-center space-x-2">
            <button *ngFor="let action of actions"
                    (click)="onActionClick(action)"
                    [title]="action.label"
                    class="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
              <lucide-angular [img]="action.icon" class="w-4 h-4"></lucide-angular>
            </button>
          </div>
        </div>
        <p *ngIf="subtitle" class="mt-1 text-sm text-gray-600">{{ subtitle }}</p>
      </div>

      <!-- Content -->
      <div class="p-6" [class]="contentClass">
        <ng-content></ng-content>
      </div>

      <!-- Footer -->
      <div *ngIf="showFooter" class="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <ng-content select="[slot=footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .card-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    
    .card-clickable {
      cursor: pointer;
    }
    
    .card-loading {
      opacity: 0.6;
      pointer-events: none;
    }
  `]
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() headerIcon?: any;
  @Input() iconClass?: string;
  @Input() headerClass?: string;
  @Input() contentClass?: string;
  @Input() cardClass?: string;
  @Input() showFooter = false;
  @Input() showActions = false;
  @Input() actions: CardAction[] = [];
  @Input() loading = false;
  @Input() clickable = false;

  @Output() actionClicked = new EventEmitter<CardAction>();
  @Output() cardClicked = new EventEmitter<void>();

  onActionClick(action: CardAction) {
    this.actionClicked.emit(action);
  }

  onCardClick() {
    if (this.clickable) {
      this.cardClicked.emit();
    }
  }
}

export interface CardAction {
  id: string;
  label: string;
  icon: any;
  action?: () => void;
}

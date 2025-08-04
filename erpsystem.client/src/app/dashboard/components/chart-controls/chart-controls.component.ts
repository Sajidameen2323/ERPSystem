import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, BarChart3, LineChart, TrendingUp } from 'lucide-angular';

export type ChartType = 'line' | 'bar' | 'area';
export type ChartTimeframe = 'daily' | 'weekly' | 'monthly';

@Component({
  selector: 'app-chart-controls',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
      <!-- Chart Type Controls -->
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Chart Type:</span>
        <div class="flex rounded-md shadow-sm">
          <button
            *ngFor="let type of chartTypes"
            (click)="onChartTypeChange(type.value)"
            [class]="getButtonClass(type.value)"
            [title]="type.label"
            class="px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
            <lucide-angular [img]="type.icon" class="w-4 h-4"></lucide-angular>
          </button>
        </div>
      </div>

      <!-- Timeframe Controls -->
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Period:</span>
        <select 
          [value]="selectedTimeframe"
          (change)="onTimeframeChange($event)"
          class="text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option *ngFor="let timeframe of timeframes" [value]="timeframe.value">
            {{ timeframe.label }}
          </option>
        </select>
      </div>
    </div>
  `,
  styles: [`
    .btn-active {
      @apply bg-blue-600 text-white;
    }
    .btn-inactive {
      @apply bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700;
    }
  `]
})
export class ChartControlsComponent {
  @Input() selectedChartType: ChartType = 'line';
  @Input() selectedTimeframe: ChartTimeframe = 'daily';
  
  @Output() chartTypeChange = new EventEmitter<ChartType>();
  @Output() timeframeChange = new EventEmitter<ChartTimeframe>();

  readonly chartTypes = [
    { value: 'line' as ChartType, label: 'Line Chart', icon: LineChart },
    { value: 'area' as ChartType, label: 'Area Chart', icon: TrendingUp },
    { value: 'bar' as ChartType, label: 'Bar Chart', icon: BarChart3 }
  ];

  readonly timeframes = [
    { value: 'daily' as ChartTimeframe, label: 'Daily' },
    { value: 'weekly' as ChartTimeframe, label: 'Weekly' },
    { value: 'monthly' as ChartTimeframe, label: 'Monthly' }
  ];

  onChartTypeChange(type: ChartType) {
    this.selectedChartType = type;
    this.chartTypeChange.emit(type);
  }

  onTimeframeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const timeframe = target.value as ChartTimeframe;
    this.selectedTimeframe = timeframe;
    this.timeframeChange.emit(timeframe);
  }

  getButtonClass(type: ChartType): string {
    const baseClasses = 'inline-flex items-center';
    const isFirst = type === this.chartTypes[0].value;
    const isLast = type === this.chartTypes[this.chartTypes.length - 1].value;
    
    let positionClasses = '';
    if (isFirst) {
      positionClasses = 'rounded-l-md';
    } else if (isLast) {
      positionClasses = 'rounded-r-md';
    } else {
      positionClasses = '';
    }
    
    const stateClasses = this.selectedChartType === type 
      ? 'btn-active' 
      : 'btn-inactive';
    
    return `${baseClasses} ${positionClasses} ${stateClasses}`;
  }
}

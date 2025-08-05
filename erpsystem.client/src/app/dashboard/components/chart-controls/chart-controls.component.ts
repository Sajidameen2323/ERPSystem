import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, BarChart3, LineChart, TrendingUp, PieChart, Zap, BarChart } from 'lucide-angular';

export type ChartType = 'line' | 'bar' | 'area' | 'doughnut' | 'radar' | 'scatter';
export type ChartTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

@Component({
  selector: 'app-chart-controls',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
      <!-- Chart Type Controls -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Chart Type:</span>
        <div class="flex flex-wrap gap-1">
          <button
            *ngFor="let type of chartTypes; trackBy: trackByChartType"
            (click)="onChartTypeChange(type.value)"
            [class]="getButtonClass(type.value)"
            [title]="type.label"
            class="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 hover:scale-105">
            <lucide-angular [img]="type.icon" class="w-3.5 h-3.5"></lucide-angular>
            <span class="ml-1.5 hidden sm:inline">{{ type.label.replace(' Chart', '').replace(' Plot', '') }}</span>
          </button>
        </div>
      </div>

      <!-- Timeframe and Dataset Controls -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <!-- Dataset Toggle -->
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Show:</span>
          <div class="flex gap-1">
            <button
              (click)="toggleDataset('revenue')"
              [class]="getDatasetButtonClass('revenue')"
              class="px-2 py-1 text-xs rounded-md transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              title="Toggle Revenue Data">
              Revenue
            </button>
            <button
              (click)="toggleDataset('orders')"
              [class]="getDatasetButtonClass('orders')"
              class="px-2 py-1 text-xs rounded-md transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              title="Toggle Order Count Data">
              Orders
            </button>
          </div>
        </div>

        <!-- Timeframe Controls -->
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Period:</span>
          <select 
            [value]="selectedTimeframe"
            (change)="onTimeframeChange($event)"
            class="text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px]">
            <option *ngFor="let timeframe of timeframes" [value]="timeframe.value">
              {{ timeframe.label }}
            </option>
          </select>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-control-container {
      @apply transition-all duration-300 ease-in-out;
    }
    
    /* Smooth hover animations */
    button:hover {
      @apply transform;
    }
    
    /* Custom scrollbar for mobile overflow */
    .chart-types-container::-webkit-scrollbar {
      @apply h-1;
    }
    
    .chart-types-container::-webkit-scrollbar-track {
      @apply bg-gray-100 dark:bg-gray-700 rounded;
    }
    
    .chart-types-container::-webkit-scrollbar-thumb {
      @apply bg-gray-300 dark:bg-gray-500 rounded hover:bg-gray-400 dark:hover:bg-gray-400;
    }
  `]
})
export class ChartControlsComponent {
  @Input() selectedChartType: ChartType = 'line';
  @Input() selectedTimeframe: ChartTimeframe = 'daily';
  @Input() showRevenue: boolean = true;
  @Input() showOrders: boolean = true;
  
  @Output() chartTypeChange = new EventEmitter<ChartType>();
  @Output() timeframeChange = new EventEmitter<ChartTimeframe>();
  @Output() datasetToggle = new EventEmitter<{type: 'revenue' | 'orders', visible: boolean}>();

  readonly chartTypes = [
    { value: 'line' as ChartType, label: 'Line Chart', icon: LineChart },
    { value: 'area' as ChartType, label: 'Area Chart', icon: TrendingUp },
    { value: 'bar' as ChartType, label: 'Bar Chart', icon: BarChart3 },
    { value: 'doughnut' as ChartType, label: 'Doughnut Chart', icon: PieChart },
    { value: 'radar' as ChartType, label: 'Radar Chart', icon: Zap },
    { value: 'scatter' as ChartType, label: 'Scatter Plot', icon: BarChart }
  ];

  readonly timeframes = [
    { value: 'daily' as ChartTimeframe, label: 'Daily' },
    { value: 'weekly' as ChartTimeframe, label: 'Weekly' },
    { value: 'monthly' as ChartTimeframe, label: 'Monthly' },
    { value: 'yearly' as ChartTimeframe, label: 'Yearly' }
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
    const baseClasses = 'inline-flex items-center transition-all duration-200';
    const stateClasses = this.selectedChartType === type 
      ? 'bg-blue-600 text-white shadow-md' 
      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm';
    
    return `${baseClasses} ${stateClasses}`;
  }

  getDatasetButtonClass(dataset: 'revenue' | 'orders'): string {
    const isVisible = dataset === 'revenue' ? this.showRevenue : this.showOrders;
    const baseClasses = 'transition-colors duration-200';
    
    return isVisible 
      ? `${baseClasses} bg-green-600 text-white`
      : `${baseClasses} bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500`;
  }

  toggleDataset(type: 'revenue' | 'orders'): void {
    const currentValue = type === 'revenue' ? this.showRevenue : this.showOrders;
    const newValue = !currentValue;
    
    if (type === 'revenue') {
      this.showRevenue = newValue;
    } else {
      this.showOrders = newValue;
    }
    
    this.datasetToggle.emit({ type, visible: newValue });
  }

  trackByChartType(index: number, item: any): string {
    return item.value;
  }
}

import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, BarChart3, LineChart, TrendingUp, Download, RotateCcw, ZoomIn, ZoomOut } from 'lucide-angular';

export type SalesChartType = 'line' | 'bar' | 'area';
export type ChartTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ExportFormat = 'png' | 'pdf' | 'csv' | 'excel';

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

      <!-- Controls Section -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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

        <!-- Export Controls -->
        <div class="flex items-center gap-1">
          <div class="relative">
            <button
              (click)="toggleExportDropdown()"
              class="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Export Chart">
              <lucide-angular [img]="icons.Download" class="w-3.5 h-3.5"></lucide-angular>
              <span class="ml-1.5 hidden sm:inline">Export</span>
            </button>
            
            <!-- Export Dropdown -->
            <div *ngIf="showExportDropdown" 
              class="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
              <button
                *ngFor="let format of exportFormats"
                (click)="onExportClick(format.value)"
                class="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md">
                {{ format.label }}
              </button>
            </div>
          </div>

          <!-- Zoom and Reset Controls -->
          <div *ngIf="enableZoom" class="flex items-center gap-1">
            <button
              (click)="onZoomIn()"
              class="inline-flex items-center px-2 py-1.5 text-xs font-medium rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              title="Zoom In">
              <lucide-angular [img]="icons.ZoomIn" class="w-3.5 h-3.5"></lucide-angular>
            </button>
            
            <button
              (click)="onZoomOut()"
              class="inline-flex items-center px-2 py-1.5 text-xs font-medium rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              title="Zoom Out">
              <lucide-angular [img]="icons.ZoomOut" class="w-3.5 h-3.5"></lucide-angular>
            </button>

            <!-- Reset Zoom Button -->
            <button
              (click)="onResetZoom()"
              class="inline-flex items-center px-2 py-1.5 text-xs font-medium rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Reset Zoom">
              <lucide-angular [img]="icons.RotateCcw" class="w-3.5 h-3.5"></lucide-angular>
            </button>
          </div>
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
  @Input() selectedChartType: SalesChartType = 'line';
  @Input() selectedTimeframe: ChartTimeframe = 'daily';
  @Input() enableZoom: boolean = true;
  
  @Output() chartTypeChange = new EventEmitter<SalesChartType>();
  @Output() timeframeChange = new EventEmitter<ChartTimeframe>();
  @Output() exportRequest = new EventEmitter<ExportFormat>();
  @Output() resetZoomRequest = new EventEmitter<void>();
  @Output() zoomInRequest = new EventEmitter<void>();
  @Output() zoomOutRequest = new EventEmitter<void>();

  showExportDropdown = false;

  readonly icons = {
    Download,
    RotateCcw,
    ZoomIn,
    ZoomOut
  };

  readonly chartTypes = [
    { value: 'line' as SalesChartType, label: 'Line Chart', icon: LineChart },
    { value: 'area' as SalesChartType, label: 'Area Chart', icon: TrendingUp },
    { value: 'bar' as SalesChartType, label: 'Bar Chart', icon: BarChart3 }
  ];

  readonly timeframes = [
    { value: 'daily' as ChartTimeframe, label: 'Daily' },
    { value: 'weekly' as ChartTimeframe, label: 'Weekly' },
    { value: 'monthly' as ChartTimeframe, label: 'Monthly' },
    { value: 'yearly' as ChartTimeframe, label: 'Yearly' }
  ];

  readonly exportFormats = [
    { value: 'png' as ExportFormat, label: 'PNG Image' },
    { value: 'pdf' as ExportFormat, label: 'PDF Report' },
    { value: 'csv' as ExportFormat, label: 'CSV Data' },
    { value: 'excel' as ExportFormat, label: 'Excel File' }
  ];

  onChartTypeChange(type: SalesChartType) {
    this.selectedChartType = type;
    this.chartTypeChange.emit(type);
  }

  onTimeframeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const timeframe = target.value as ChartTimeframe;
    this.selectedTimeframe = timeframe;
    this.timeframeChange.emit(timeframe);
  }

  getButtonClass(type: SalesChartType): string {
    const baseClasses = 'inline-flex items-center transition-all duration-200';
    const stateClasses = this.selectedChartType === type 
      ? 'bg-blue-600 text-white shadow-md' 
      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm';
    
    return `${baseClasses} ${stateClasses}`;
  }

  toggleExportDropdown(): void {
    this.showExportDropdown = !this.showExportDropdown;
  }

  onExportClick(format: ExportFormat): void {
    this.showExportDropdown = false;
    this.exportRequest.emit(format);
  }

  onResetZoom(): void {
    this.resetZoomRequest.emit();
  }

  onZoomIn(): void {
    this.zoomInRequest.emit();
  }

  onZoomOut(): void {
    this.zoomOutRequest.emit();
  }

  trackByChartType(index: number, item: any): string {
    return item.value;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.showExportDropdown) {
      const target = event.target as HTMLElement;
      const dropdown = target.closest('.relative');
      if (!dropdown) {
        this.showExportDropdown = false;
      }
    }
  }
}

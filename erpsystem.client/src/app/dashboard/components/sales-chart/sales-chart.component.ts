import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartType,
  registerables,
  TooltipItem
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns';
import { DashboardChartData } from '../../models/dashboard.model';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// Register Chart.js components and plugins
Chart.register(...registerables, zoomPlugin, annotationPlugin);

export type SalesChartType = 'line' | 'bar' | 'area';
export type SalesTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ExportFormat = 'png' | 'pdf' | 'csv' | 'excel';

export interface SalesChartOptions {
  chartType?: SalesChartType;
  timeframe?: SalesTimeframe;
  groupBy?: 'day' | 'week' | 'month' | 'year';
  enableZoom?: boolean;
  enableAnnotations?: boolean;
}

@Component({
  selector: 'app-sales-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-chart.component.html',
  styleUrl: './sales-chart.component.css'
})
export class SalesChartComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() chartData: DashboardChartData | null = null;
  @Input() options: SalesChartOptions = {
    chartType: 'line',
    timeframe: 'daily',
    groupBy: 'day',
    enableZoom: true,
    enableAnnotations: false
  };
  @Input() height: string = '400px';
  @Input() darkMode: boolean = false;
  
  @Output() chartExported = new EventEmitter<{format: ExportFormat, success: boolean}>();
  
  private chart: Chart | null = null;
  isShowingSampleData: boolean = false;
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnInit() {
    // Initialize isShowingSampleData state early
    this.checkIfShowingSampleData();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    // React to input changes, especially chartData, options, and darkMode
    if (changes['chartData'] || changes['options'] || changes['darkMode']) {
      this.checkIfShowingSampleData();
      
      // If options or darkMode changed, we need to recreate the chart with new configuration
      if ((changes['options'] || changes['darkMode']) && this.chart) {
        this.initializeChart(); // Recreate the chart with new configuration
      } else if (changes['chartData'] && this.chart) {
        // If only data changed, just update the data
        const chartData = this.prepareChartData();
        this.chart.data = chartData;
        this.chart.update('resize');
      }
    }
  }
  
  ngAfterViewInit() {
    this.initializeChart();
  }
  
  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
  
  private checkIfShowingSampleData() {
    // Check if we should show sample data and update the flag
    const shouldShowSample = !this.chartData || !this.chartData.labels || this.chartData.labels.length === 0 || 
        !this.chartData.datasets || this.chartData.datasets.length === 0;
    
    if (this.isShowingSampleData !== shouldShowSample) {
      this.isShowingSampleData = shouldShowSample;
      this.cdr.detectChanges();
    }
  }
  
  private initializeChart() {
    if (!this.chartCanvas?.nativeElement) {
      return;
    }
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }
    
    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }
    
    const chartData = this.prepareChartData();
    const chartConfig = this.getChartConfiguration(chartData);
    
    this.chart = new Chart(ctx, chartConfig);
    
    // Apply smooth area chart styling if chart type is area
    if (this.options.chartType === 'area') {
      this.applyAreaChartSmoothing(true);
    }
  }
  
  private prepareChartData(): ChartData {
    // Check the state before preparing data
    this.checkIfShowingSampleData();
    
    // If showing sample data, use default chart data
    if (this.isShowingSampleData) {
      console.log('No chart data available, using sample data');
      return this.getDefaultChartData();
    }

    // Sales charts only support line, bar, and area - all use the same data structure
    return {
      labels: this.chartData!.labels,
      datasets: this.chartData!.datasets.map((dataset, index) => {
        const isAreaChart = this.options.chartType === 'area';
        const isRevenue = dataset.label?.toLowerCase().includes('revenue');
        const defaultColors = this.getDefaultColors();
        
        return {
          label: dataset.label,
          data: dataset.data,
          backgroundColor: dataset.backgroundColor || defaultColors.backgroundColor[index],
          borderColor: dataset.borderColor || defaultColors.borderColor[index],
          borderWidth: isAreaChart ? 2.5 : (dataset.borderWidth || 2),
          fill: dataset.fill !== undefined ? dataset.fill : 
                isAreaChart ? (isRevenue ? {
                  target: 'origin',
                  above: dataset.backgroundColor || defaultColors.backgroundColor[index],
                  below: this.darkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)'
                } : {
                  target: '-1',
                  above: dataset.backgroundColor || defaultColors.backgroundColor[index], 
                  below: this.darkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)'
                }) : false,
          tension: isAreaChart ? 0.4 : (dataset.tension || 0.1),
          pointBackgroundColor: dataset.borderColor || defaultColors.borderColor[index],
          pointBorderColor: this.darkMode ? '#1F2937' : '#fff',
          pointBorderWidth: 2,
          pointRadius: isAreaChart ? 3 : 4,
          pointHoverRadius: 6,
          yAxisID: isRevenue ? 'y' : 'y1',
          cubicInterpolationMode: isAreaChart ? 'monotone' : 'default',
          stepped: false
        };
      })
    };
  }
  
  private getDefaultChartData(): ChartData {
    // Generate more realistic sample data for demonstration
    const today = new Date();
    const daysToShow = this.options.timeframe === 'monthly' ? 12 : 
                       this.options.timeframe === 'weekly' ? 8 : 30;
    
    const labels: string[] = [];
    const revenueData: number[] = [];
    const ordersData: number[] = [];
    
    // Generate data based on timeframe
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      
      if (this.options.timeframe === 'monthly') {
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        // Monthly data: higher values
        revenueData.push(Math.floor(Math.random() * 50000) + 25000 + (Math.sin(i * 0.3) * 10000));
        ordersData.push(Math.floor(Math.random() * 200) + 100 + (Math.sin(i * 0.3) * 50));
      } else if (this.options.timeframe === 'weekly') {
        date.setDate(date.getDate() - (i * 7));
        labels.push('Week ' + (Math.ceil((today.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1));
        // Weekly data: medium values
        revenueData.push(Math.floor(Math.random() * 20000) + 10000 + (Math.sin(i * 0.5) * 5000));
        ordersData.push(Math.floor(Math.random() * 80) + 40 + (Math.sin(i * 0.5) * 20));
      } else {
        // Daily data
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        // Add some realistic patterns: weekends lower, gradual growth trend
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const baseRevenue = 3000 + (i * 50); // Growth trend
        const weekendMultiplier = isWeekend ? 0.6 : 1;
        const randomVariation = (Math.random() - 0.5) * 1000;
        
        revenueData.push(Math.max(500, Math.floor((baseRevenue + randomVariation) * weekendMultiplier)));
        ordersData.push(Math.max(5, Math.floor(((baseRevenue / 100) + (Math.random() - 0.5) * 10) * weekendMultiplier)));
      }
    }
    
    const datasets: any[] = [];
    const defaultColors = this.getDefaultColors();
    
    // Always show revenue dataset
    datasets.push({
      label: 'Revenue ($)',
      data: revenueData,
      borderColor: defaultColors.borderColor[0],
      backgroundColor: defaultColors.backgroundColor[0],
      borderWidth: this.options.chartType === 'area' ? 2.5 : 2,
      fill: this.options.chartType === 'area' ? {
        target: 'origin',
        above: defaultColors.backgroundColor[0],
        below: this.darkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)'
      } : false,
      tension: this.options.chartType === 'area' ? 0.4 : 0.1,
      yAxisID: 'y',
      pointBackgroundColor: defaultColors.borderColor[0],
      pointBorderColor: this.darkMode ? '#1F2937' : '#fff',
      pointBorderWidth: 2,
      pointRadius: this.options.chartType === 'area' ? 3 : 4,
      pointHoverRadius: 6,
      order: 1,
      cubicInterpolationMode: this.options.chartType === 'area' ? 'monotone' : 'default',
      stepped: false
    });
    
    // Always show orders dataset
    datasets.push({
      label: 'Orders',
      data: ordersData,
      borderColor: defaultColors.borderColor[1],
      backgroundColor: defaultColors.backgroundColor[1],
      borderWidth: this.options.chartType === 'area' ? 2.5 : 2,
      fill: this.options.chartType === 'area' ? {
        target: '-1',
        above: defaultColors.backgroundColor[1],
        below: this.darkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)'
      } : false,
      tension: this.options.chartType === 'area' ? 0.4 : 0.1,
      yAxisID: 'y1',
      pointBackgroundColor: defaultColors.borderColor[1],
      pointBorderColor: this.darkMode ? '#1F2937' : '#fff',
      pointBorderWidth: 2,
      pointRadius: this.options.chartType === 'area' ? 3 : 4,
      pointHoverRadius: 6,
      order: 2,
      cubicInterpolationMode: this.options.chartType === 'area' ? 'monotone' : 'default',
      stepped: false
    });
    
    return {
      labels: labels,
      datasets: datasets
    };
  }
  
  private getDefaultColors() {
    const isDark = this.darkMode;
    const isAreaChart = this.options.chartType === 'area';
    
    return {
      backgroundColor: [
        isAreaChart ? 
          (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)') : 
          (isDark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.6)'),
        isAreaChart ? 
          (isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)') : 
          (isDark ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.6)'),
        isAreaChart ? 
          (isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.15)') : 
          (isDark ? 'rgba(245, 158, 11, 0.8)' : 'rgba(245, 158, 11, 0.6)'),
        isAreaChart ? 
          (isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.15)') : 
          (isDark ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.6)'),
      ],
      borderColor: [
        isDark ? '#60A5FA' : '#3B82F6',  // Lighter blue in dark mode
        isDark ? '#34D399' : '#10B981',  // Lighter green in dark mode
        isDark ? '#FBBF24' : '#F59E0B',  // Lighter amber in dark mode
        isDark ? '#F87171' : '#EF4444',  // Lighter red in dark mode
      ]
    };
  }
  
  private getChartConfiguration(chartData: ChartData): ChartConfiguration {
    const isDark = this.darkMode;
    const textColor = isDark ? '#F3F4F6' : '#374151';       // Brighter text in dark mode
    const gridColor = isDark ? '#4B5563' : '#E5E7EB';       // Better contrast grid in dark mode
    const backgroundColor = isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)';
    const borderColor = isDark ? '#6B7280' : '#D1D5DB';     // Better border contrast
    
    // Map our chart types to Chart.js types
    const chartTypeMapping: { [key: string]: ChartType } = {
      'line': 'line',
      'bar': 'bar',
      'area': 'line' // Area is line with fill: true
    };
    
    const mappedChartType = chartTypeMapping[this.options.chartType || 'line'] || 'line';
    
    // Base configuration with industry-standard features
    const config: ChartConfiguration = {
      type: mappedChartType,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: textColor,
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                weight: 'normal'
              }
            }
          },
          tooltip: {
            backgroundColor: backgroundColor,
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: borderColor,
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            titleFont: {
              size: 13,
              weight: 'bold'
            },
            bodyFont: {
              size: 12
            },
            padding: 12,
            callbacks: {
              title: (context: TooltipItem<any>[]) => {
                return context[0]?.label || '';
              },
              label: (context: TooltipItem<any>) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                
                if (label.toLowerCase().includes('revenue')) {
                  return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                }
                return `${label}: ${value.toLocaleString('en-US')}`;
              },
              footer: (context: TooltipItem<any>[]) => {
                if (context.length > 1) {
                  const total = context.reduce((sum, item) => {
                    if (item.dataset.label?.toLowerCase().includes('revenue')) {
                      return sum + item.parsed.y;
                    }
                    return sum;
                  }, 0);
                  return total > 0 ? `Total Revenue: $${total.toLocaleString()}` : '';
                }
                return '';
              }
            }
          },
          zoom: this.options.enableZoom ? {
            pan: {
              enabled: true,
              mode: 'x' as const,
              modifierKey: 'ctrl' as const
            },
            zoom: {
              wheel: {
                enabled: true,
                modifierKey: 'ctrl' as const
              },
              pinch: {
                enabled: true
              },
              mode: 'x' as const
            }
          } as any : undefined
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: this.getXAxisTitle(),
              color: textColor,
              font: {
                size: 13,
                weight: 'bold'
              }
            },
            grid: {
              color: gridColor,
              display: true
            },
            ticks: {
              color: textColor,
              maxTicksLimit: 10,
              font: {
                size: 11
              }
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Revenue ($)',
              color: textColor,
              font: {
                size: 13,
                weight: 'bold'
              }
            },
            grid: {
              color: gridColor,
              display: true
            },
            ticks: {
              color: textColor,
              font: {
                size: 11
              },
              callback: function(value: any) {
                return '$' + value.toLocaleString('en-US', { 
                  notation: value > 1000000 ? 'compact' : 'standard',
                  compactDisplay: 'short'
                });
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Order Count',
              color: textColor,
              font: {
                size: 13,
                weight: 'bold'
              }
            },
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              color: textColor,
              font: {
                size: 11
              }
            }
          }
        }
      }
    };

    // Set element styles for better visual appeal
    if (['line', 'area'].includes(this.options.chartType || 'line')) {
      const isAreaChart = this.options.chartType === 'area';
      
      config.options!.elements = {
        point: {
          radius: isAreaChart ? 3 : 4,
          hoverRadius: isAreaChart ? 6 : 7,
          borderWidth: 2,
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 1)',
          borderColor: isDark ? '#F3F4F6' : '#374151',
          hitRadius: 10
        },
        line: {
          borderWidth: isAreaChart ? 2.5 : 3,
          tension: isAreaChart ? 0.4 : 0.2,
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
          cubicInterpolationMode: isAreaChart ? 'monotone' : 'default'
        }
      };
      
      // Add specific area chart animations for smooth transitions
      if (isAreaChart) {
        config.options!.animation = {
          duration: 1000,
          easing: 'easeInOutCubic'
        };
        
        // Add transitions for smooth updates
        config.options!.transitions = {
          active: {
            animation: {
              duration: 300
            }
          }
        };
      }
    }

    return config;
  }

  private getXAxisTitle(): string {
    switch (this.options.timeframe) {
      case 'daily': return 'Date';
      case 'weekly': return 'Week';
      case 'monthly': return 'Month';
      case 'yearly': return 'Year';
      default: return 'Time Period';
    }
  }
  
  // Public method to update chart data
  updateChart(newData: DashboardChartData | null) {
    this.chartData = newData;
    this.checkIfShowingSampleData();
    
    // Fully reinitialize the chart to ensure theme changes are applied
    this.initializeChart();
  }
  
  // Public method to toggle chart type
  toggleChartType(type: SalesChartType) {
    this.options.chartType = type;
    this.initializeChart();
    
    // Apply smooth area chart styling if switching to area chart
    if (type === 'area') {
      // Use setTimeout to ensure chart is fully initialized before applying styling
      setTimeout(() => {
        this.applyAreaChartSmoothing(true);
      }, 100);
    }
  }

  // Public method to update groupBy and refresh chart data
  updateGroupBy(groupBy: 'day' | 'week' | 'month' | 'year') {
    this.options.groupBy = groupBy;
    // Emit event or call parent method to refresh data with new groupBy
    // This allows parent component to call dashboard service with new groupBy parameter
  }

  // Public method to get current groupBy setting
  getCurrentGroupBy(): string {
    return this.options.groupBy || 'day';
  }

  // Public method to check if chart type supports certain features
  supportsMultipleDatasets(): boolean {
    return true; // All sales chart types support multiple datasets
  }

  supportsDualAxis(): boolean {
    return true; // All sales chart types support dual axis
  }

  supportsZoom(): boolean {
    return ['line', 'area'].includes(this.options.chartType || 'line');
  }

  // Export functions
  async exportChart(format: ExportFormat): Promise<void> {
    if (!this.chart) {
      console.error('Chart not initialized');
      this.chartExported.emit({ format, success: false });
      return;
    }

    try {
      switch (format) {
        case 'png':
          await this.exportToPNG();
          break;
        case 'pdf':
          await this.exportToPDF();
          break;
        case 'csv':
          await this.exportToCSV();
          break;
        case 'excel':
          await this.exportToExcel();
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      this.chartExported.emit({ format, success: true });
    } catch (error) {
      console.error(`Error exporting chart as ${format}:`, error);
      this.chartExported.emit({ format, success: false });
    }
  }

  private async exportToPNG(): Promise<void> {
    if (!this.chart) return;
    
    const canvas = this.chart.canvas;
    const url = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = `sales-chart-${this.getFilenameSuffix()}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private async exportToPDF(): Promise<void> {
    if (!this.chart) return;

    const canvas = this.chart.canvas;
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate aspect ratio to fit the image
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const width = imgWidth * ratio;
    const height = imgHeight * ratio;
    
    // Center the image
    const x = (pdfWidth - width) / 2;
    const y = (pdfHeight - height) / 2;

    // Add title
    pdf.setFontSize(16);
    pdf.text('Sales Chart Report', pdfWidth / 2, 15, { align: 'center' });
    
    // Add timestamp
    pdf.setFontSize(10);
    const timestamp = new Date().toLocaleString();
    pdf.text(`Generated: ${timestamp}`, pdfWidth / 2, 25, { align: 'center' });

    // Add chart
    pdf.addImage(imgData, 'PNG', x, y + 20, width, height - 20);

    pdf.save(`sales-chart-${this.getFilenameSuffix()}.pdf`);
  }

  private async exportToCSV(): Promise<void> {
    const data = this.prepareDataForExport();
    const csv = this.convertToCSV(data);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-data-${this.getFilenameSuffix()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private async exportToExcel(): Promise<void> {
    const data = this.prepareDataForExport();
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    // Auto-size columns
    const columnWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key]).length))
    }));
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');
    
    XLSX.writeFile(workbook, `sales-data-${this.getFilenameSuffix()}.xlsx`);
  }

  private prepareDataForExport(): any[] {
    const chartData = this.isShowingSampleData ? this.getDefaultChartData() : this.prepareChartData();
    const labels = chartData.labels || [];
    const datasets = chartData.datasets || [];
    
    return labels.map((label, index) => {
      const row: any = { 'Time Period': label };
      
      datasets.forEach(dataset => {
        const value = dataset.data[index];
        row[dataset.label || 'Unknown'] = value;
      });
      
      return row;
    });
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }

  private getFilenameSuffix(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `${dateStr}_${timeStr}`;
  }

  // Reset zoom functionality
  resetZoom(): void {
    if (this.chart && this.options.enableZoom) {
      (this.chart as any).resetZoom?.();
    }
  }

  // Zoom in functionality
  zoomIn(): void {
    if (this.chart && this.options.enableZoom) {
      (this.chart as any).zoom?.(1.2);
    }
  }

  // Zoom out functionality
  zoomOut(): void {
    if (this.chart && this.options.enableZoom) {
      (this.chart as any).zoom?.(0.8);
    }
  }

  // Apply smooth area chart styling
  private applyAreaChartSmoothing(smooth: boolean = true): void {
    if (!this.chart || this.options.chartType !== 'area') {
      return;
    }

    // Update all datasets for area chart fill and smoothing
    this.chart.data.datasets.forEach((dataset: any) => {
      dataset.fill = 'origin';
      dataset.tension = smooth ? 0.4 : 0;
    });

    // Update chart options for line element tension
    if (this.chart.options?.elements?.line) {
      (this.chart.options.elements.line as any).tension = smooth ? 0.4 : 0;
    }

    // Update the chart to apply changes
    this.chart.update('resize');
  }

  // Public method to toggle smooth area chart
  toggleSmoothAreaChart(smooth: boolean = true): void {
    this.applyAreaChartSmoothing(smooth);
  }
}

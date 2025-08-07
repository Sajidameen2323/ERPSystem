import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, Package, DollarSign, BarChart3 } from 'lucide-angular';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartType,
  registerables,
  TooltipItem
} from 'chart.js';
import { ProductPerformanceData } from '../../models/dashboard.model';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-product-performance-chart',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './product-performance-chart.component.html',
  styleUrl: './product-performance-chart.component.css'
})
export class ProductPerformanceChartComponent implements OnInit, OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() productData: ProductPerformanceData[] = [];
  @Input() darkMode: boolean = false;
  @Input() height: string = '300px';
  @Input() metric: 'revenue' | 'salesCount' | 'profitMargin' = 'revenue';
  @Input() isLoading: boolean = false;

  private chart: Chart<'doughnut'> | null = null;
  private chartInitialized = false;
  
  // Lucide icons
  readonly icons = {
    TrendingUp,
    Package,
    DollarSign,
    BarChart3
  };

  // Chart color palette
  private readonly colorPalette = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('ProductPerformanceChartComponent initialized');
    console.log('Initial product data:', this.productData);
    // Don't initialize chart here - wait for view to be ready
  }

  ngAfterViewInit(): void {
    // Check if canvas is available and data exists
    this.attemptChartInitialization();
  }

  ngAfterViewChecked(): void {
    // Try to initialize chart if it hasn't been initialized yet and conditions are met
    if (!this.chartInitialized && this.canInitializeChart()) {
      this.attemptChartInitialization();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productData']) {
      const currentData = changes['productData'].currentValue;
      const previousData = changes['productData'].previousValue;
      
      console.log('Product data changed in chart:', {
        current: currentData,
        previous: previousData,
        isFirstChange: changes['productData'].firstChange
      });
      
      // If data becomes available for the first time or changes, update or initialize chart
      if (currentData !== previousData) {
        if (!this.chartInitialized && this.canInitializeChart()) {
          this.attemptChartInitialization();
        } else if (this.chartInitialized) {
          this.updateChart();
        }
      }
    }
    
    // Handle dark mode changes
    if (changes['darkMode'] && this.chartInitialized && !changes['darkMode'].firstChange) {
      console.log('Dark mode changed, refreshing chart...');
      this.refreshChart();
    }
    
    if (changes['isLoading']) {
      // When loading state changes, check if we can initialize the chart
      if (!changes['isLoading'].currentValue && !this.chartInitialized) {
        this.attemptChartInitialization();
      }
    }
    
    if (changes['darkMode'] || changes['metric']) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private canInitializeChart(): boolean {
    return !!(this.chartCanvas?.nativeElement && !this.isLoading && this.productData && this.productData.length > 0);
  }

  private attemptChartInitialization(): void {
    if (this.canInitializeChart() && !this.chartInitialized) {
      console.log('Attempting to initialize chart...');
      setTimeout(() => {
        this.initializeChart();
      }, 0);
    }
  }

  private initializeChart(): void {
    if (!this.chartCanvas?.nativeElement) {
      console.warn('Chart canvas not available');
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Unable to get 2D context from canvas');
      return;
    }

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    try {
      const chartData = this.getChartData();
      const chartOptions = this.getChartOptions();
      
      console.log('Initializing chart with data:', chartData);
      console.log('Chart options:', chartOptions);

      const config: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: chartData,
        options: chartOptions
      };

      this.chart = new Chart(ctx, config);
      this.chartInitialized = true;
      console.log('Chart initialized successfully');
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }

  private updateChart(): void {
    if (!this.chart) {
      // If chart doesn't exist, try to initialize it
      this.attemptChartInitialization();
      return;
    }

    try {
      // Get new data and options
      const newData = this.getChartData();
      const newOptions = this.getChartOptions();
      
      console.log('Updating chart with new data:', newData);

      // Update chart data
      this.chart.data = newData;
      
      // Update chart options
      if (newOptions) {
        Object.assign(this.chart.options, newOptions);
      }
      
      // Update the chart with animation
      this.chart.update('active');
      
      // Trigger change detection
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error updating chart:', error);
      // If update fails, try to reinitialize
      this.initializeChart();
    }
  }

  private getChartData(): ChartData<'doughnut'> {
    if (!this.productData || this.productData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#E5E7EB'],
          borderColor: ['#E5E7EB'],
          borderWidth: 0
        }]
      };
    }

    // Sort by selected metric and take top 10
    const sortedData = [...this.productData]
      .sort((a, b) => this.getMetricValue(b) - this.getMetricValue(a))
      .slice(0, 10);

    const labels = sortedData.map(item => item.name);
    const data = sortedData.map(item => {
      const value = this.getMetricValue(item);
      return isNaN(value) ? 0 : Math.max(0, value); // Ensure positive numbers
    });
    const colors = sortedData.map((item, index) => 
      item.color || this.colorPalette[index % this.colorPalette.length]
    );

    // Ensure we have valid data
    const hasValidData = data.some(value => value > 0);
    
    if (!hasValidData) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#E5E7EB'],
          borderColor: ['#E5E7EB'],
          borderWidth: 0
        }]
      };
    }

    console.log('Chart data generated:', { labels, data, colors });

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors.map(() => this.darkMode ? '#1F2937' : '#FFFFFF'),
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: colors.map(() => this.darkMode ? '#374151' : '#F3F4F6'),
        hoverBackgroundColor: colors.map(color => {
          // Lighten colors on hover
          return color + '20'; // Add transparency
        })
      }]
    };
  }

  private getMetricValue(item: ProductPerformanceData): number {
    if (!item) return 0;
    
    switch (this.metric) {
      case 'revenue':
        return item.revenue || 0;
      case 'salesCount':
        return item.salesCount || 0;
      case 'profitMargin':
        return item.profitMargin || 0;
      default:
        return item.revenue || 0;
    }
  }

  private getChartOptions(): ChartConfiguration<'doughnut'>['options'] {
    const textColor = this.darkMode ? '#D1D5DB' : '#374151';
    const gridColor = this.darkMode ? '#374151' : '#E5E7EB';

    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      layout: {
        padding: 10
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 15,
            font: {
              size: 12,
              family: 'Inter, system-ui, sans-serif'
            },
            boxWidth: 12,
            boxHeight: 12
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: this.darkMode ? '#1F2937' : '#FFFFFF',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 12
          },
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: (tooltipItems) => {
              return tooltipItems[0]?.label || '';
            },
            label: (context: TooltipItem<'doughnut'>) => {
              const value = context.parsed;
              const dataset = context.dataset;
              const total = dataset.data.reduce((sum: number, val) => sum + (val as number), 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              
              return [
                `${this.getMetricLabel()}: ${this.formatMetricValue(value)}`,
                `Percentage: ${percentage}%`
              ];
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: false,
        duration: 1000,
        easing: 'easeOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'point'
      },
      onHover: (event, elements) => {
        if (this.chartCanvas?.nativeElement) {
          this.chartCanvas.nativeElement.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      }
    };
  }

  public getMetricLabel(): string {
    switch (this.metric) {
      case 'revenue':
        return 'Revenue';
      case 'salesCount':
        return 'Sales Count';
      case 'profitMargin':
        return 'Profit Margin';
      default:
        return 'Value';
    }
  }

  public formatMetricValue(value: number): string {
    switch (this.metric) {
      case 'revenue':
        return this.formatCurrency(value);
      case 'salesCount':
        return this.formatNumber(value);
      case 'profitMargin':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  }

  private formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toString();
    }
  }

  // Public methods for external controls
  switchMetric(newMetric: 'revenue' | 'salesCount' | 'profitMargin'): void {
    this.metric = newMetric;
    this.updateChart();
  }

  refreshChart(): void {
    console.log('Refreshing chart...');
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.chartInitialized = false;
    setTimeout(() => {
      this.attemptChartInitialization();
    }, 100);
  }

  exportChart(format: 'png' | 'pdf' = 'png'): void {
    if (!this.chart) return;

    if (format === 'png') {
      const url = this.chart.toBase64Image();
      const link = document.createElement('a');
      link.download = 'product-performance-chart.png';
      link.href = url;
      link.click();
    }
  }

  getTopPerformer(): ProductPerformanceData | null {
    if (!this.productData || this.productData.length === 0) return null;
    
    return this.productData.reduce((top, current) => 
      this.getMetricValue(current) > this.getMetricValue(top) ? current : top
    );
  }

  getTotalMetricValue(): number {
    if (!this.productData || this.productData.length === 0) return 0;
    
    return this.productData.reduce((total, item) => total + this.getMetricValue(item), 0);
  }
}

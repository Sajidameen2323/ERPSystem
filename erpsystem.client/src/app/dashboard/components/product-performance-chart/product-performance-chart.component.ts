import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
export class ProductPerformanceChartComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() productData: ProductPerformanceData[] = [];
  @Input() darkMode: boolean = false;
  @Input() height: string = '300px';
  @Input() metric: 'revenue' | 'salesCount' | 'profitMargin' = 'revenue';

  private chart: Chart<'doughnut'> | null = null;
  
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
    this.initializeChart();
  }

  ngAfterViewInit(): void {
    if (this.productData.length > 0) {
      this.updateChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productData'] || changes['darkMode'] || changes['metric']) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initializeChart(): void {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: this.getChartData(),
      options: this.getChartOptions()
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) {
      setTimeout(() => this.initializeChart(), 100);
      return;
    }

    this.chart.data = this.getChartData();
    const options = this.getChartOptions();
    if (options) {
      Object.assign(this.chart.options, options);
    }
    this.chart.update('active');
  }

  private getChartData(): ChartData<'doughnut'> {
    if (!this.productData || this.productData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#E5E7EB'],
          borderWidth: 0
        }]
      };
    }

    // Sort by selected metric and take top 10
    const sortedData = [...this.productData]
      .sort((a, b) => this.getMetricValue(b) - this.getMetricValue(a))
      .slice(0, 10);

    const labels = sortedData.map(item => item.name);
    const data = sortedData.map(item => this.getMetricValue(item));
    const colors = sortedData.map((item, index) => 
      item.color || this.colorPalette[index % this.colorPalette.length]
    );

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: this.darkMode ? '#1F2937' : '#FFFFFF',
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: this.darkMode ? '#374151' : '#F3F4F6'
      }]
    };
  }

  private getMetricValue(item: ProductPerformanceData): number {
    switch (this.metric) {
      case 'revenue':
        return item.revenue;
      case 'salesCount':
        return item.salesCount;
      case 'profitMargin':
        return item.profitMargin;
      default:
        return item.revenue;
    }
  }

  private getChartOptions(): ChartConfiguration<'doughnut'>['options'] {
    const textColor = this.darkMode ? '#D1D5DB' : '#374151';
    const gridColor = this.darkMode ? '#374151' : '#E5E7EB';

    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: this.darkMode ? '#1F2937' : '#FFFFFF',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          callbacks: {
            label: (context: TooltipItem<'doughnut'>) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((sum: number, val) => sum + (val as number), 0);
              const percentage = ((value / total) * 100).toFixed(1);
              
              return [
                `${label}`,
                `${this.getMetricLabel()}: ${this.formatMetricValue(value)}`,
                `Percentage: ${percentage}%`
              ];
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000
      },
      onHover: (event, elements) => {
        if (this.chartCanvas) {
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

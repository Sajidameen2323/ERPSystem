import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartType,
  registerables,
  TooltipItem
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { DashboardChartData } from '../../models/dashboard.model';

// Register Chart.js components
Chart.register(...registerables);

export interface SalesChartOptions {
  showRevenue?: boolean;
  showOrders?: boolean;
  chartType?: 'line' | 'bar' | 'area';
  timeframe?: 'daily' | 'weekly' | 'monthly';
}

@Component({
  selector: 'app-sales-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-chart.component.html',
  styleUrl: './sales-chart.component.css'
})
export class SalesChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() chartData: DashboardChartData | null = null;
  @Input() options: SalesChartOptions = {
    showRevenue: true,
    showOrders: true,
    chartType: 'line',
    timeframe: 'daily'
  };
  @Input() height: string = '400px';
  @Input() darkMode: boolean = false;
  
  private chart: Chart | null = null;
  isShowingSampleData: boolean = false;
  
  ngOnInit() {
    // Chart will be initialized in AfterViewInit
  }
  
  ngAfterViewInit() {
    this.initializeChart();
  }
  
  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
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
  }
  
  private prepareChartData(): ChartData {
    // If no chart data or empty data, use default sample data
    if (!this.chartData || !this.chartData.labels || this.chartData.labels.length === 0 || 
        !this.chartData.datasets || this.chartData.datasets.length === 0) {
      console.log('No chart data available, using sample data');
      this.isShowingSampleData = true;
      return this.getDefaultChartData();
    }
    
    this.isShowingSampleData = false;
    return {
      labels: this.chartData.labels,
      datasets: this.chartData.datasets.map((dataset, index) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor || this.getDefaultColors().backgroundColor[index],
        borderColor: dataset.borderColor || this.getDefaultColors().borderColor[index],
        borderWidth: dataset.borderWidth || 2,
        fill: dataset.fill !== undefined ? dataset.fill : (this.options.chartType === 'area'),
        tension: dataset.tension || 0.4,
        pointBackgroundColor: dataset.borderColor || this.getDefaultColors().borderColor[index],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: dataset.label?.toLowerCase().includes('revenue') ? 'y' : 'y1'
      }))
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
    
    if (this.options.showRevenue) {
      datasets.push({
        label: 'Revenue ($)',
        data: revenueData,
        borderColor: '#3B82F6',
        backgroundColor: this.options.chartType === 'area' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.8)',
        borderWidth: 2,
        fill: this.options.chartType === 'area',
        tension: 0.4,
        yAxisID: 'y',
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      });
    }
    
    if (this.options.showOrders) {
      datasets.push({
        label: 'Orders',
        data: ordersData,
        borderColor: '#10B981',
        backgroundColor: this.options.chartType === 'area' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.8)',
        borderWidth: 2,
        fill: this.options.chartType === 'area',
        tension: 0.4,
        yAxisID: 'y1',
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      });
    }
    
    return {
      labels: labels,
      datasets: datasets
    };
  }
  
  private getDefaultColors() {
    const isDark = this.darkMode;
    
    return {
      backgroundColor: [
        isDark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.6)',
        isDark ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.6)',
        isDark ? 'rgba(245, 158, 11, 0.8)' : 'rgba(245, 158, 11, 0.6)',
        isDark ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.6)',
      ],
      borderColor: [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
      ]
    };
  }
  
  private getChartConfiguration(chartData: ChartData): ChartConfiguration {
    const isDark = this.darkMode;
    const textColor = isDark ? '#E5E7EB' : '#374151';
    const gridColor = isDark ? '#374151' : '#E5E7EB';
    
    return {
      type: this.options.chartType === 'area' ? 'line' : (this.options.chartType || 'line') as ChartType,
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
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            callbacks: {
              label: (context: TooltipItem<any>) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                
                if (label.toLowerCase().includes('revenue')) {
                  return `${label}: $${value.toLocaleString()}`;
                }
                return `${label}: ${value.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time Period',
              color: textColor
            },
            grid: {
              color: gridColor,
              display: true
            },
            ticks: {
              color: textColor,
              maxTicksLimit: 10
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Revenue ($)',
              color: textColor
            },
            grid: {
              color: gridColor,
              display: true
            },
            ticks: {
              color: textColor,
              callback: function(value: any) {
                return '$' + value.toLocaleString();
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Orders',
              color: textColor
            },
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              color: textColor
            }
          }
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6
          },
          line: {
            borderWidth: 2
          }
        }
      }
    };
  }
  
  // Public method to update chart data
  updateChart(newData: DashboardChartData | null) {
    this.chartData = newData;
    if (this.chart) {
      const chartData = this.prepareChartData();
      this.chart.data = chartData;
      this.chart.update('resize');
    }
  }
  
  // Public method to toggle chart type
  toggleChartType(type: 'line' | 'bar' | 'area') {
    this.options.chartType = type;
    this.initializeChart();
  }
}

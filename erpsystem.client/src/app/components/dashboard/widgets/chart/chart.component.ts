import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, BarChart3, PieChart } from 'lucide-angular';
import { DashboardChartData } from '../../../../core/models';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css'
})
export class ChartComponent {
  @Input() data: DashboardChartData[] = [];
  @Input() title: string = 'Chart';
  @Input() type: 'bar' | 'pie' = 'bar';

  // Lucide icons
  readonly barChartIcon = BarChart3;
  readonly pieChartIcon = PieChart;

  get maxValue(): number {
    return Math.max(...this.data.map(d => d.value), 1);
  }

  getBarHeight(value: number): number {
    return (value / this.maxValue) * 100;
  }

  get totalValue(): number {
    return this.data.reduce((sum, item) => sum + item.value, 0);
  }

  getPercentage(value: number): number {
    return (value / this.totalValue) * 100;
  }
}

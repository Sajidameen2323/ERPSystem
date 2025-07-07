import { Component } from '@angular/core';
import { LayoutComponent } from '../shared/components/layout/layout.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
}

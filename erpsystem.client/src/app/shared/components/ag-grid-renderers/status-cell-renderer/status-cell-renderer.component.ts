import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { LucideAngularModule, CheckCircle, XCircle } from 'lucide-angular';

@Component({
  selector: 'app-status-cell-renderer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './status-cell-renderer.component.html',
  styleUrl: './status-cell-renderer.component.css'
})
export class StatusCellRendererComponent implements ICellRendererAngularComp {
  readonly icons = {
    CheckCircle,
    XCircle
  };

  params!: ICellRendererParams;
  isActive!: boolean;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.isActive = params.data?.isActive || false;
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.isActive = params.data?.isActive || false;
    return true;
  }

  get statusText(): string {
    return this.isActive ? 'Active' : 'Inactive';
  }

  get statusIcon() {
    return this.isActive ? this.icons.CheckCircle : this.icons.XCircle;
  }

  get badgeClass(): string {
    return this.isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  }
}

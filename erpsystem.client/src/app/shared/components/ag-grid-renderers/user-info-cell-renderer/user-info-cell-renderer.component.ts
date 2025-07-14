import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-user-info-cell-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-info-cell-renderer.component.html',
  styleUrl: './user-info-cell-renderer.component.css'
})
export class UserInfoCellRendererComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  user: any;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.user = params.data;
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.user = params.data;
    return true;
  }

  get initials(): string {
    if (this.user?.firstName && this.user?.lastName) {
      return `${this.user.firstName[0]}${this.user.lastName[0]}`;
    }
    return this.user?.email?.[0]?.toUpperCase() || '?';
  }

  get fullName(): string {
    return this.user?.displayName || `${this.user?.firstName} ${this.user?.lastName}`;
  }

  get email(): string {
    return this.user?.email || '';
  }
}

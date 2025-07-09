import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-roles-cell-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roles-cell-renderer.component.html',
  styleUrl: './roles-cell-renderer.component.css'
})
export class RolesCellRendererComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  roles: string[] = [];

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.roles = params.data?.roles || [];
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.roles = params.data?.roles || [];
    return true;
  }

  getRoleBadgeClass(role: string): string {
    const roleClasses: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      'salesuser': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'inventoryuser': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
    };
    return roleClasses[role.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
}

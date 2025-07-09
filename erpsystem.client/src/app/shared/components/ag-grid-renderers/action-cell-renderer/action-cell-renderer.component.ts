import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { LucideAngularModule, Edit, CheckCircle, XCircle } from 'lucide-angular';

export interface ActionCellRendererParams extends ICellRendererParams {
  onEdit?: (data: any) => void;
  onToggleStatus?: (data: any) => void;
  editIcon?: any;
  statusIcon?: any;
  editTooltip?: string;
  statusTooltip?: string;
  showEdit?: boolean;
  showToggleStatus?: boolean;
}

@Component({
  selector: 'app-action-cell-renderer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './action-cell-renderer.component.html',
  styleUrl: './action-cell-renderer.component.css'
})
export class ActionCellRendererComponent implements ICellRendererAngularComp {
  readonly icons = {
    Edit,
    CheckCircle,
    XCircle
  };

  params!: ActionCellRendererParams;

  agInit(params: ActionCellRendererParams): void {
    this.params = params;
  }

  refresh(params: ActionCellRendererParams): boolean {
    this.params = params;
    return true;
  }

  onEdit() {
    if (this.params.onEdit) {
      this.params.onEdit(this.params.data);
    }
  }

  onToggleStatus() {
    if (this.params.onToggleStatus) {
      this.params.onToggleStatus(this.params.data);
    }
  }

  get showEdit(): boolean {
    return this.params.showEdit !== false;
  }

  get showToggleStatus(): boolean {
    return this.params.showToggleStatus !== false;
  }

  get editIcon() {
    return this.params.editIcon || this.icons.Edit;
  }

  get statusIcon() {
    return this.params.statusIcon || (this.params.data?.isActive ? this.icons.XCircle : this.icons.CheckCircle);
  }

  get editTooltip(): string {
    return this.params.editTooltip || 'Edit';
  }

  get statusTooltip(): string {
    return this.params.statusTooltip || (this.params.data?.isActive ? 'Deactivate' : 'Activate');
  }

  get statusButtonClass(): string {
    return this.params.data?.isActive 
      ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
      : 'text-green-600 hover:text-green-900 hover:bg-green-50';
  }
}

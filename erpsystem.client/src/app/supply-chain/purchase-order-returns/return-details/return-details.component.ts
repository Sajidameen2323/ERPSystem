import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  ArrowLeft,
  Package,
  Calendar,
  User,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Eye,
  Edit,
  Trash2
} from 'lucide-angular';
import { Subject, takeUntil, catchError, of, switchMap } from 'rxjs';

import { 
  PurchaseOrderReturn,
  ApproveReturnRequest,
  CancelReturnRequest,
  ReturnStatus,
  ProcessReturnRequest,
  ReturnReason
} from '../../../shared/models/purchase-order.interface';
import { PurchaseOrderReturnService } from '../../../shared/services/purchase-order-return.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { LayoutService } from '../../../shared/services/layout.service';

@Component({
  selector: 'app-return-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './return-details.component.html',
  styleUrl: './return-details.component.css'
})
export class ReturnDetailsComponent implements OnInit, OnDestroy {
  // Injected services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private returnService = inject(PurchaseOrderReturnService);
  public themeService = inject(ThemeService);
  public layoutService = inject(LayoutService);

  // State signals
  returnData = signal<PurchaseOrderReturn | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  actionLoading = signal(false);

  // Computed properties
  themeClasses = computed(() => this.themeService.getClasses());

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly PackageIcon = Package;
  readonly CalendarIcon = Calendar;
  readonly UserIcon = User;
  readonly FileTextIcon = FileText;
  readonly DollarSignIcon = DollarSign;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly ClockIcon = Clock;
  readonly SettingsIcon = Settings;
  readonly EyeIcon = Eye;
  readonly EditIcon = Edit;
  readonly Trash2Icon = Trash2;

  // Enum references for template
  readonly ReturnStatus = ReturnStatus;

  // Reactive streams
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.params.pipe(
      switchMap(params => {
        const id = params['id'];
        if (!id) {
          this.router.navigate(['/supply-chain/purchase-order-returns']);
          return of(null);
        }
        this.loadReturnDetails(id);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadReturnDetails(id: string) {
    this.loading.set(true);
    this.error.set(null);

    return this.returnService.getReturn(id).pipe(
      catchError(error => {
        console.error('Error loading return details:', error);
        this.error.set('Failed to load return details. Please try again.');
        return of(null);
      })
    ).subscribe(result => {
      this.loading.set(false);
      if (result?.data) {
        this.returnData.set(result.data);
      }
    });
  }

  getStatusBadgeClass(status: ReturnStatus): string {
    return this.returnService.getStatusBadgeClass(status);
  }

  getStatusText(status: ReturnStatus): string {
    return this.returnService.getStatusText(status);
  }

  getReasonDisplayText(reason: ReturnReason): string {
    return this.returnService.getReasonDisplayText(reason);
  }

  approveReturn(): void {
    const returnData = this.returnData();
    if (!returnData || returnData.status !== ReturnStatus.Pending) {
      return;
    }

    this.actionLoading.set(true);
    
    const request: ApproveReturnRequest = {
      notes: 'Approved via return details page'
    };

    this.returnService.approveReturn(returnData.id, request).pipe(
      catchError(error => {
        console.error('Error approving return:', error);
        this.error.set('Failed to approve return. Please try again.');
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.actionLoading.set(false);
      if (result?.data) {
        this.returnData.set(result.data);
      }
    });
  }

  cancelReturn(): void {
    const returnData = this.returnData();
    if (!returnData || returnData.status !== ReturnStatus.Pending) {
      return;
    }

    this.actionLoading.set(true);
    
    const request: CancelReturnRequest = {
      notes: 'Cancelled via return details page'
    };

    this.returnService.cancelReturn(returnData.id, request).pipe(
      catchError(error => {
        console.error('Error cancelling return:', error);
        this.error.set('Failed to cancel return. Please try again.');
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.actionLoading.set(false);
      if (result?.data) {
        this.returnData.set(result.data);
      }
    });
  }

  processReturn(): void {
    const returnData = this.returnData();
    if (!returnData || returnData.status !== ReturnStatus.Approved) {
      return;
    }

    this.actionLoading.set(true);
    
    // Mark all items as refund processed
    const request: ProcessReturnRequest = {
      items: returnData.items.map(item => ({
        returnItemId: item.id,
        refundProcessed: true,
        notes: 'Processed via return details page'
      })),
      notes: 'All refunds processed'
    };

    this.returnService.processReturn(returnData.id, request).pipe(
      catchError(error => {
        console.error('Error processing return:', error);
        this.error.set('Failed to process return. Please try again.');
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.actionLoading.set(false);
      if (result?.data) {
        this.returnData.set(result.data);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/supply-chain/purchase-order-returns']);
  }

  canApprove(): boolean {
    return this.returnData()?.status === ReturnStatus.Pending;
  }

  canCancel(): boolean {
    return this.returnData()?.status === ReturnStatus.Pending;
  }

  canProcess(): boolean {
    return this.returnData()?.status === ReturnStatus.Approved;
  }

  getTotalQuantity(): number {
    const returnData = this.returnData();
    if (!returnData?.items) return 0;
    return returnData.items.reduce((sum, item) => sum + item.returnQuantity, 0);
  }

  getRefundsRequestedCount(): number {
    const returnData = this.returnData();
    if (!returnData?.items) return 0;
    return returnData.items.filter(item => item.refundRequested).length;
  }

  getRefundsProcessedCount(): number {
    const returnData = this.returnData();
    if (!returnData?.items) return 0;
    return returnData.items.filter(item => item.refundProcessed).length;
  }
}

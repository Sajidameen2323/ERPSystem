import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { LucideAngularModule, 
  ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, 
  Calendar, DollarSign, Star, TrendingUp, Package,
  Eye, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-angular';

import { Supplier } from '../../shared/models/supplier.interface';
import { PurchaseOrder, PurchaseOrderQueryParameters, PurchaseOrderStatus } from '../../shared/models/purchase-order.interface';
import { SupplierService } from '../../shared/services/supplier.service';
import { PurchaseOrderService } from '../../shared/services/purchase-order.service';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './supplier-detail.component.html',
  styleUrl: './supplier-detail.component.css'
})
export class SupplierDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  supplier: Supplier | null = null;
  recentPurchaseOrders: PurchaseOrder[] = [];
  supplierStats = {
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    lastOrderDate: null as Date | null
  };
  
  loading = true;
  error: string | null = null;
  
  // Lucide icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly EditIcon = Edit;
  readonly TrashIcon = Trash2;
  readonly PhoneIcon = Phone;
  readonly MailIcon = Mail;
  readonly MapPinIcon = MapPin;
  readonly CalendarIcon = Calendar;
  readonly DollarSignIcon = DollarSign;
  readonly StarIcon = Star;
  readonly TrendingUpIcon = TrendingUp;
  readonly PackageIcon = Package;
  readonly EyeIcon = Eye;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly ClockIcon = Clock;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: SupplierService,
    private purchaseOrderService: PurchaseOrderService
  ) {}

  ngOnInit(): void {
    this.loadSupplierData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSupplierData(): void {
    this.loading = true;
    this.error = null;

    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const supplierId = params['id'];
        
        // Load supplier details and recent purchase orders in parallel
        return forkJoin({
          supplier: this.supplierService.getSupplier(supplierId),
          purchaseOrders: this.loadRecentPurchaseOrders(supplierId)
        });
      })
    ).subscribe({
      next: ({ supplier, purchaseOrders }) => {
        this.supplier = supplier;
        this.recentPurchaseOrders = purchaseOrders.items || [];
        this.calculateSupplierStats(purchaseOrders.items || []);
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load supplier details';
        this.loading = false;
      }
    });
  }

  private loadRecentPurchaseOrders(supplierId: string) {
    const params: PurchaseOrderQueryParameters = {
      page: 1,
      pageSize: 10,
      supplierId: supplierId,
      sortBy: 'orderDate',
      sortDirection: 'desc'
    };
    
    return this.purchaseOrderService.getPurchaseOrders(params);
  }

  private calculateSupplierStats(orders: PurchaseOrder[]): void {
    if (!orders || orders.length === 0) {
      this.supplierStats = {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        averageOrderValue: 0,
        lastOrderDate: null
      };
      return;
    }

    this.supplierStats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'Pending' || o.status === 'Approved' || o.status === 'Sent').length,
      completedOrders: orders.filter(o => o.status === 'Received').length,
      averageOrderValue: orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length,
      lastOrderDate: orders.length > 0 ? orders[0].orderDate : null
    };
  }

  editSupplier(): void {
    if (this.supplier) {
      this.router.navigate(['dashboard/supply-chain/suppliers', this.supplier.id, 'edit']);
    }
  }

  deleteSupplier(): void {
    if (!this.supplier) return;

    if (confirm(`Are you sure you want to delete supplier "${this.supplier.name}"? This action cannot be undone.`)) {
      this.supplierService.deleteSupplier(this.supplier.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.router.navigate(['dashboard/supply-chain/suppliers']);
        },
        error: (error) => {
          this.error = error.message || 'Failed to delete supplier';
        }
      });
    }
  }

  toggleSupplierStatus(): void {
    if (!this.supplier) return;

    const action = this.supplier.isActive ? 
      this.supplierService.deactivateSupplier(this.supplier.id) :
      this.supplierService.activateSupplier(this.supplier.id);

    action.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        if (this.supplier) {
          this.supplier.isActive = !this.supplier.isActive;
        }
      },
      error: (error: any) => {
        this.error = error.message || 'Failed to update supplier status';
      }
    });
  }

  createPurchaseOrder(): void {
    this.router.navigate(['dashboard/supply-chain/purchase-orders/new'], {
      queryParams: { supplierId: this.supplier?.id }
    });
  }

  viewAllPurchaseOrders(): void {
    this.router.navigate(['dashboard/supply-chain/purchase-orders'], {
      queryParams: { supplierId: this.supplier?.id }
    });
  }

  viewPurchaseOrder(orderId: string): void {
    this.router.navigate(['dashboard/supply-chain/purchase-orders', orderId]);
  }

  goBack(): void {
    this.router.navigate(['dashboard/supply-chain/suppliers']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Sent':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'PartiallyReceived':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Received':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getPerformanceRatingClass(rating?: number): string {
    if (!rating) return 'text-gray-500 dark:text-gray-400';
    
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400';
    if (rating >= 4.0) return 'text-green-500 dark:text-green-300';
    if (rating >= 3.5) return 'text-yellow-600 dark:text-yellow-400';
    if (rating >= 3.0) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  getStatusText(status: PurchaseOrderStatus): string {
    switch (status) {
      case PurchaseOrderStatus.Draft:
        return 'Draft';
      case PurchaseOrderStatus.Pending:
        return 'Pending';
      case PurchaseOrderStatus.Approved:
        return 'Approved';
      case PurchaseOrderStatus.Sent:
        return 'Sent';
      case PurchaseOrderStatus.PartiallyReceived:
        return 'Partially Received';
      case PurchaseOrderStatus.Received:
        return 'Received';
      case PurchaseOrderStatus.Cancelled:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }
}

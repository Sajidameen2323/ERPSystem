import { Routes } from '@angular/router';
import { OktaCallbackComponent } from '@okta/okta-angular';
import { adminGuard, salesUserGuard, inventoryUserGuard, managerGuard, roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';
import { CurrentUserResolver } from './core/resolvers/current-user.resolver';

export const routes: Routes = [
  // Default route - redirect to login
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Login page
  { 
    path: 'login', 
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  
  // Okta callback route
  { path: 'login/callback', component: OktaCallbackComponent },
  
  // Unauthorized page
  { 
    path: 'unauthorized', 
    loadComponent: () => import('./shared/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent),
    canActivate: [guestGuard]
  },
  
  // Dashboard routes
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { requiredRoles: ['admin', 'salesuser', 'inventoryuser'], requireAll: false },
    resolve: { currentUser: CurrentUserResolver },
    children: [
      // Default dashboard route
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
      },
      // Admin routes
      {
        path: 'admin/users',
        loadComponent: () => import('./dashboard/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/register',
        loadComponent: () => import('./dashboard/admin/admin-users/register-user/register-user.component').then(m => m.RegisterUserComponent),
        canActivate: [adminGuard]
      },
      // Profile route (available to all authenticated users)
      {
        path: 'profile',
        loadComponent: () => import('./dashboard/profile/profile.component').then(m => m.ProfileComponent)
      },
      // Inventory routes
      {
        path: 'inventory/products',
        loadComponent: () => import('./inventory/product-list/product-list.component').then(m => m.ProductListComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'inventory/products/new',
        loadComponent: () => import('./inventory/product-form/product-form.component').then(m => m.ProductFormComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'inventory/products/:id/view',
        loadComponent: () => import('./inventory/product-view/product-view.component').then(m => m.ProductViewComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'inventory/products/:id/edit',
        loadComponent: () => import('./inventory/product-form/product-form.component').then(m => m.ProductFormComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'inventory/adjustments',
        loadComponent: () => import('./inventory/stock-adjustment-list/stock-adjustment-list.component').then(m => m.StockAdjustmentListComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'inventory/alerts',
        loadComponent: () => import('./inventory/low-stock-alerts/low-stock-alerts.component').then(m => m.LowStockAlertsComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'inventory/stock-movements',
        loadComponent: () => import('./inventory/stock-movement-list/stock-movement-list.component').then(m => m.StockMovementListComponent),
        canActivate: [inventoryUserGuard]
      },
      // Sales routes
      {
        path: 'sales/customers',
        loadComponent: () => import('./sales/customer-list/customer-list.component').then(m => m.CustomerListComponent),
        canActivate: [salesUserGuard]
      },
      {
        path: 'sales/customers/new',
        loadComponent: () => import('./sales/customer-form/customer-form.component').then(m => m.CustomerFormComponent),
        canActivate: [salesUserGuard]
      },
      {
        path: 'sales/customers/:id',
        loadComponent: () => import('./sales/customer-detail/customer-detail.component').then(m => m.CustomerDetailComponent),
        canActivate: [salesUserGuard]
      },
      {
        path: 'sales/customers/:id/edit',
        loadComponent: () => import('./sales/customer-form/customer-form.component').then(m => m.CustomerFormComponent),
        canActivate: [salesUserGuard]
      },
      // Sales Order routes
      {
        path: 'sales/orders',
        loadComponent: () => import('./sales/sales-order-list/sales-order-list.component').then(m => m.SalesOrderListComponent),
        canActivate: [salesUserGuard]
      },
      {
        path: 'sales/orders/new',
        loadComponent: () => import('./sales/sales-order-form/sales-order-form.component').then(m => m.SalesOrderFormComponent),
        canActivate: [salesUserGuard]
      },
      {
        path: 'sales/orders/:id',
        loadComponent: () => import('./sales/sales-order-detail/sales-order-detail.component').then(m => m.SalesOrderDetailComponent),
        canActivate: [salesUserGuard]
      },
      {
        path: 'sales/orders/:id/edit',
        loadComponent: () => import('./sales/sales-order-form/sales-order-form.component').then(m => m.SalesOrderFormComponent),
        canActivate: [salesUserGuard]
      },
      // Invoice routes
      {
        path: 'sales/invoices',
        loadComponent: () => import('./sales/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent),
        canActivate: [salesUserGuard]
      },
      {
        path: 'sales/invoices/new',
        loadComponent: () => import('./sales/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent),
        canActivate: [salesUserGuard]
      },
      {
        path: 'sales/invoices/:id',
        loadComponent: () => import('./sales/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent),
        canActivate: [salesUserGuard]
      },
      {
        path: 'sales/invoices/:id/edit',
        loadComponent: () => import('./sales/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent),
        canActivate: [salesUserGuard]
      },
      {
        path: 'sales/invoices/:id/payment',
        loadComponent: () => import('./sales/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent),
        canActivate: [salesUserGuard]
      },
      // Supply Chain routes
      {
        path: 'supply-chain/suppliers',
        loadComponent: () => import('./supply-chain/supplier-list/supplier-list.component').then(m => m.SupplierListComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'supply-chain/suppliers/new',
        loadComponent: () => import('./supply-chain/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'supply-chain/suppliers/:id',
        loadComponent: () => import('./supply-chain/supplier-detail/supplier-detail.component').then(m => m.SupplierDetailComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'supply-chain/suppliers/:id/edit',
        loadComponent: () => import('./supply-chain/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'supply-chain/purchase-orders',
        loadComponent: () => import('./supply-chain/purchase-order-list/purchase-order-list.component').then(m => m.PurchaseOrderListComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'supply-chain/purchase-orders/new',
        loadComponent: () => import('./supply-chain/purchase-order-form/purchase-order-form.component').then(m => m.PurchaseOrderFormComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'supply-chain/purchase-orders/:id',
        loadComponent: () => import('./supply-chain/purchase-order-detail/purchase-order-detail.component').then(m => m.PurchaseOrderDetailComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'supply-chain/purchase-orders/:id/edit',
        loadComponent: () => import('./supply-chain/purchase-order-form/purchase-order-form.component').then(m => m.PurchaseOrderFormComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'supply-chain/purchase-order-returns',
        loadComponent: () => import('./supply-chain/purchase-order-returns/return-list/return-list.component').then(m => m.ReturnListComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'supply-chain/purchase-order-returns/new',
        loadComponent: () => import('./supply-chain/purchase-order-returns/return-form/return-form.component').then(m => m.ReturnFormComponent),
        canActivate: [inventoryUserGuard]
      },
      {
        path: 'supply-chain/purchase-order-returns/:id',
        loadComponent: () => import('./supply-chain/purchase-order-returns/return-details/return-details.component').then(m => m.ReturnDetailsComponent),
        canActivate: [inventoryUserGuard]
      }
    ]
  },
  
  // Legacy route redirects
  { 
    path: 'admin', 
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  
  // Wildcard route - redirect to login
  { path: '**', redirectTo: '/login' }
];

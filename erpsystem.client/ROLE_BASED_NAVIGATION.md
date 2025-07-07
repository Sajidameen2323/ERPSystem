# Role-Based Navigation Implementation

## Overview

The ERP system now implements role-based navigation that dynamically shows/hides navigation items based on the current user's roles. This ensures users only see features they have permission to access.

## How It Works

### 1. User Role Loading
- **Layout Component** loads the current user profile from `AuthService.getCurrentUserProfile()`
- Extracts user roles from the server response
- Sets the roles in a signal for reactive updates

### 2. Navigation Filtering
- **Sidebar Component** receives user roles as input
- Uses `SidebarConfigService.getNavigationItems(userRoles)` to filter navigation
- Only shows items where user has at least one required role

### 3. Dynamic Updates
- Navigation items update automatically when user roles change
- Uses Angular's `OnChanges` lifecycle to detect role updates
- Reactive system ensures UI stays in sync with user permissions

## Role Configuration

### Available Roles
Based on the server-side constants:
- `admin` - Administrator access
- `salesuser` - Sales module access  
- `inventoryuser` - Inventory module access

### Navigation Item Roles
Each navigation item specifies required roles:

```typescript
{
  label: 'Administration',
  icon: Settings,
  roles: ['admin'], // Only admins can see this
  children: [
    { 
      label: 'User Management', 
      route: '/dashboard/admin/users', 
      roles: ['admin'] 
    }
  ]
},
{
  label: 'Sales',
  icon: ShoppingCart,
  roles: ['admin', 'salesuser'], // Admins and sales users
  children: [...]
},
{
  label: 'Dashboard',
  icon: Home,
  route: '/dashboard',
  roles: ['admin', 'salesuser', 'inventoryuser'] // All users
}
```

## Implementation Details

### Layout Component Changes
```typescript
// Load user and roles
loadCurrentUser(): void {
  this.authService.getCurrentUserProfile().subscribe({
    next: (result) => {
      if (result.isSuccess && result.data) {
        const user = result.data;
        this.currentUser.set(user);
        this.userRoles.set(user.roles || []);
        // Update header profile...
      }
    }
  });
}
```

### Sidebar Component Changes
```typescript
// React to role changes
ngOnChanges(changes: SimpleChanges) {
  if (changes['userRoles']) {
    this.updateNavigationItems();
  }
}

// Filter navigation based on roles
private updateNavigationItems() {
  this.navigationItems = this.sidebarConfigService
    .getNavigationItems(this.userRoles);
}
```

### Sidebar Config Service Filtering
```typescript
getNavigationItems(userRoles: string[] = []): NavigationItem[] {
  return this.navigationItems
    .filter(item => this.hasRequiredRole(item, userRoles))
    .map(item => ({
      ...item,
      children: item.children?.filter(child => 
        this.hasRequiredRole(child, userRoles))
    }));
}

hasRequiredRole(item: NavigationItem, userRoles: string[]): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  return item.roles.some(role => userRoles.includes(role));
}
```

## User Experience

### Admin User
Sees all navigation items:
- Dashboard
- Inventory (Products, Stock Adjustments, Low Stock Alerts)
- Sales (Customers, Sales Orders, Invoices)
- Reports (Sales, Inventory, Customer)
- Administration (User Management, Register User, System Settings)

### Sales User
Sees limited navigation:
- Dashboard
- Sales (Customers, Sales Orders, Invoices)
- Reports (Sales, Customer)

### Inventory User
Sees inventory-focused navigation:
- Dashboard
- Inventory (Products, Stock Adjustments, Low Stock Alerts)
- Reports (Inventory)

### Guest/No Roles
Sees minimal navigation:
- Dashboard only (if accessible to all)

## Security Considerations

### Client-Side vs Server-Side
- **Client-side filtering**: Controls UI visibility for UX
- **Server-side authorization**: Enforces actual access control
- Both layers work together for complete security

### Route Guards
Should be implemented alongside navigation filtering:
```typescript
// Example route guard (not yet implemented)
canActivate(): boolean {
  const userRoles = this.authService.getCurrentUserRoles();
  return userRoles.includes('admin');
}
```

## Testing Role-Based Navigation

### Manual Testing
1. **Login as Admin**: Should see all navigation items
2. **Login as Sales User**: Should only see Dashboard, Sales, and related Reports
3. **Login as Inventory User**: Should only see Dashboard, Inventory, and related Reports
4. **No Authentication**: Should see minimal navigation or be redirected

### Debugging
Add temporary logging to see role filtering in action:
```typescript
// In sidebar component
private updateNavigationItems() {
  console.log('User roles:', this.userRoles);
  this.navigationItems = this.sidebarConfigService.getNavigationItems(this.userRoles);
  console.log('Visible items:', this.navigationItems.map(item => item.label));
}
```

## Error Handling

### Authentication Failures
- If user profile loading fails, roles default to empty array
- Guest user profile shown in header
- Only public navigation items visible

### Invalid Roles
- Unknown roles are ignored
- Navigation filtering gracefully handles missing/invalid roles
- Fails closed (restricts access when in doubt)

## Future Enhancements

### Dynamic Role Updates
- Real-time role changes via WebSocket/SignalR
- Automatic navigation refresh when roles change
- Role expiration handling

### Granular Permissions
- Action-level permissions (read, write, delete)
- Feature flags integration
- Context-specific role requirements

### Role Hierarchy
- Role inheritance (admin inherits all permissions)
- Custom role definitions
- Department-based role assignments

## Code Locations

### Modified Files
- `src/app/shared/components/layout/layout.component.ts` - User role loading
- `src/app/shared/components/sidebar/sidebar.component.ts` - Role change detection
- `src/app/shared/services/sidebar-config.service.ts` - Navigation filtering logic

### Related Files  
- `ERPSystem.Server/Common/Constants.cs` - Server-side role definitions
- `src/app/core/models/user.interface.ts` - User and role interfaces
- `src/app/core/services/auth.service.ts` - Authentication service

This implementation provides a foundation for secure, role-based navigation that can be extended as the application grows.

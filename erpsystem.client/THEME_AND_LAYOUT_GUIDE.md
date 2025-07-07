# ERP System - Theme and Layout Configuration Guide

This guide explains how to use and extend the refactored theme and layout system in the ERP frontend application.

## Overview

The layout system has been refactored into three main services:

1. **ThemeService** - Handles dark/light mode and theme configuration
2. **SidebarConfigService** - Manages sidebar navigation and behavior
3. **LayoutService** - Handles responsive layout and breakpoints

## Theme Service

### Basic Usage

```typescript
import { ThemeService } from '../../shared/services/theme.service';

constructor(private themeService: ThemeService) {}

// Toggle dark mode
toggleDarkMode() {
  this.themeService.toggleDarkMode();
}

// Set specific theme
setDarkMode(isDark: boolean) {
  this.themeService.setDarkMode(isDark);
}

// Check current theme
get isDarkMode() {
  return this.themeService.isDarkMode();
}
```

### Getting Theme Classes

```typescript
// In component
get themeClasses() {
  return this.themeService.getClasses();
}

// In template
<div [ngClass]="themeClasses.card">Card content</div>
<div [ngClass]="themeClasses.main">Main content</div>
<footer [ngClass]="themeClasses.footer">Footer</footer>
```

### Available Theme Classes

- `container` - Main container with theme colors
- `card` - Card background and borders
- `sidebar` - Sidebar styling
- `header` - Header styling
- `footer` - Footer styling
- `main` - Main content area
- `textPrimary` - Primary text color
- `textSecondary` - Secondary text color
- `textMuted` - Muted text color
- `buttonPrimary` - Primary button styling
- `buttonSecondary` - Secondary button styling
- `border` - Border color

### Customizing Theme Configuration

```typescript
// Update theme colors
this.themeService.updateThemeConfig({
  light: {
    background: {
      card: 'bg-blue-50',
      sidebar: 'bg-blue-100'
    }
  }
});
```

## Sidebar Configuration Service

### Basic Usage

```typescript
import { SidebarConfigService } from '../../shared/services/sidebar-config.service';

constructor(private sidebarConfig: SidebarConfigService) {}

// Toggle sidebar
toggleSidebar() {
  this.sidebarConfig.toggleCollapsed();
}

// Get navigation items for user roles
get navigationItems() {
  return this.sidebarConfig.getNavigationItems(this.userRoles);
}
```

### Managing Navigation Items

```typescript
// Add new navigation item
this.sidebarConfig.addNavigationItem({
  label: 'Custom Module',
  icon: CustomIcon,
  route: '/custom',
  roles: ['admin']
});

// Update existing item
this.sidebarConfig.updateNavigationItem('Dashboard', {
  badge: '5'
});

// Remove item
this.sidebarConfig.removeNavigationItem('Custom Module');
```

### Navigation Item Structure

```typescript
interface NavigationItem {
  label: string;           // Display name
  icon?: any;             // Lucide icon component
  route?: string;         // Router link
  children?: NavigationItem[]; // Sub-navigation
  roles?: string[];       // Required user roles
  badge?: string;         // Badge text (for notifications)
}
```

### Sidebar Configuration Options

```typescript
// Update sidebar behavior
this.sidebarConfig.updateConfig({
  persistState: true,           // Save collapsed state
  autoCollapseOnMobile: true,   // Auto-collapse on mobile
  collapsedWidth: 'w-20',       // Custom collapsed width
  expandedWidth: 'w-72'         // Custom expanded width
});
```

## Layout Service

### Basic Usage

```typescript
import { LayoutService } from '../../shared/services/layout.service';

constructor(private layoutService: LayoutService) {}

// Check screen size
get isMobile() {
  return this.layoutService.isMobile();
}

get isDesktop() {
  return this.layoutService.isDesktop();
}
```

### Responsive Grid Classes

```typescript
// Get responsive grid classes
getGridClasses() {
  return this.layoutService.getGridClasses({
    mobile: 1,
    tablet: 2,
    desktop: 3,
    largeDesktop: 4
  });
}
```

### Utility Classes

```typescript
// Get spacing classes
get spacing() {
  return this.layoutService.getSpacingClasses();
}

// Get animation classes
get animations() {
  return this.layoutService.getAnimationClasses();
}

// Get container classes
get containerClasses() {
  return this.layoutService.getContainerClasses();
}
```

## Component Integration

### Layout Component Usage

The main layout component automatically handles theme and sidebar integration:

```html
<!-- layout.component.html -->
<div [ngClass]="containerClass()">
  <!-- Sidebar with theme and responsive behavior -->
  <app-sidebar 
    [isCollapsed]="isSidebarCollapsed"
    [userRoles]="userRoles"
    [isDarkMode]="isDarkMode()"
    (toggleSidebar)="toggleSidebar()"
    (logout)="handleLogout()">
  </app-sidebar>

  <!-- Main content with theme classes -->
  <main [ngClass]="themeService.getClasses().main + ' flex-1 overflow-auto'">
    <router-outlet></router-outlet>
  </main>
</div>
```

### Creating New Components

When creating new components, inject and use the services:

```typescript
@Component({
  selector: 'app-custom-component',
  template: `
    <div [ngClass]="themeClasses.card + ' p-6 rounded-lg'">
      <h2 [ngClass]="themeClasses.textPrimary">Title</h2>
      <p [ngClass]="themeClasses.textSecondary">Content</p>
    </div>
  `
})
export class CustomComponent {
  constructor(private themeService: ThemeService) {}

  get themeClasses() {
    return this.themeService.getClasses();
  }
}
```

## Best Practices

### 1. Use Service Classes Instead of Hardcoded Tailwind

**❌ Don't:**
```html
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

**✅ Do:**
```html
<div [ngClass]="themeService.getClasses().card">
```

### 2. Leverage Responsive Utilities

**❌ Don't:**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

**✅ Do:**
```html
<div [ngClass]="layoutService.getGridClasses({ mobile: 1, tablet: 2, desktop: 3 })">
```

### 3. Role-Based Navigation

Always filter navigation items by user roles:

```typescript
get visibleNavItems() {
  return this.sidebarConfig.getNavigationItems(this.currentUser.roles);
}
```

### 4. Consistent Theming

Use theme service for all color-related styling:

```typescript
// In component styles
get buttonClass() {
  return this.themeService.getClasses().buttonPrimary + ' px-4 py-2 rounded';
}
```

## Migration from Old Code

### Before (Layout Component)
```typescript
// Old signal-based approach
isDarkMode = signal(false);
isSidebarCollapsed = signal(false);
isMobile = signal(false);

toggleDarkMode() {
  this.isDarkMode.set(!this.isDarkMode());
}
```

### After (Service-based)
```typescript
// New service-based approach
constructor(
  public themeService: ThemeService,
  public sidebarConfig: SidebarConfigService
) {}

get isDarkMode() { return this.themeService.isDarkMode; }
get isSidebarCollapsed() { return this.sidebarConfig.isCollapsed; }

toggleDarkMode() {
  this.themeService.toggleDarkMode();
}
```

## Performance Considerations

1. **Computed Properties**: All computed classes are cached and only update when dependencies change
2. **LocalStorage**: Theme and sidebar preferences are automatically persisted
3. **Responsive**: Layout service uses efficient window resize listening
4. **Memory**: Services handle cleanup automatically

## Troubleshooting

### Theme Not Updating
- Ensure `ThemeService` is injected properly
- Check if `dark` class is applied to document root
- Verify Tailwind dark mode configuration

### Sidebar Not Responsive
- Confirm `LayoutService` is detecting screen size changes
- Check if mobile breakpoint (1024px) is appropriate for your design
- Verify CSS classes are applied correctly

### Navigation Items Not Showing
- Check user roles array
- Verify navigation item roles configuration
- Ensure `SidebarConfigService.getNavigationItems()` is called with correct roles

## Extension Examples

### Adding Custom Theme
```typescript
// Custom theme for holiday mode
const holidayTheme = {
  light: {
    primary: 'bg-red-600 text-white',
    background: {
      card: 'bg-red-50',
      sidebar: 'bg-green-50'
    }
  }
};

this.themeService.updateThemeConfig(holidayTheme);
```

### Dynamic Navigation
```typescript
// Add navigation based on feature flags
if (this.featureService.isEnabled('reports-v2')) {
  this.sidebarConfig.addNavigationItem({
    label: 'Advanced Reports',
    icon: BarChart,
    route: '/reports-v2',
    roles: ['admin', 'analyst']
  });
}
```

This refactored system provides a clean, maintainable, and extensible foundation for the ERP frontend's theme and layout management.

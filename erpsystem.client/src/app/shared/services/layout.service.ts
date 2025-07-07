import { Injectable, signal, computed } from '@angular/core';

export interface LayoutBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  largeDesktop: number;
}

export interface LayoutConfig {
  breakpoints: LayoutBreakpoints;
  sidebarBehavior: {
    autoCollapseOnMobile: boolean;
    persistStateOnDesktop: boolean;
    overlayOnMobile: boolean;
  };
  animations: {
    sidebarTransition: string;
    themeTransition: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private config: LayoutConfig = {
    breakpoints: {
      mobile: 640,
      tablet: 768,
      desktop: 1024,
      largeDesktop: 1280
    },
    sidebarBehavior: {
      autoCollapseOnMobile: true,
      persistStateOnDesktop: true,
      overlayOnMobile: true
    },
    animations: {
      sidebarTransition: 'transition-all duration-300 ease-in-out',
      themeTransition: 'transition-colors duration-300'
    }
  };

  // Layout state
  private windowWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Computed properties for responsive breakpoints
  isMobile = computed(() => this.windowWidth() < this.config.breakpoints.desktop);
  isTablet = computed(() => 
    this.windowWidth() >= this.config.breakpoints.tablet && 
    this.windowWidth() < this.config.breakpoints.desktop
  );
  isDesktop = computed(() => this.windowWidth() >= this.config.breakpoints.desktop);
  isLargeDesktop = computed(() => this.windowWidth() >= this.config.breakpoints.largeDesktop);

  constructor() {
    this.initializeResponsiveListener();
  }

  /**
   * Initialize responsive window listener
   */
  private initializeResponsiveListener(): void {
    if (typeof window === 'undefined') return;

    // Set initial window width
    this.windowWidth.set(window.innerWidth);

    // Listen for resize events
    const handleResize = () => {
      this.windowWidth.set(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
  }

  /**
   * Get current screen size category
   */
  getScreenSize(): 'mobile' | 'tablet' | 'desktop' | 'large-desktop' {
    if (this.isLargeDesktop()) return 'large-desktop';
    if (this.isDesktop()) return 'desktop';
    if (this.isTablet()) return 'tablet';
    return 'mobile';
  }

  /**
   * Get layout configuration
   */
  getConfig(): LayoutConfig {
    return { ...this.config };
  }

  /**
   * Update layout configuration
   */
  updateConfig(newConfig: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get responsive classes for containers
   */
  getContainerClasses(): string {
    return 'container mx-auto px-4 py-6 lg:px-6 max-w-7xl';
  }

  /**
   * Get grid classes based on screen size
   */
  getGridClasses(cols: { mobile?: number; tablet?: number; desktop?: number; largeDesktop?: number }): string {
    const classes = [];
    
    if (cols.mobile) classes.push(`grid-cols-${cols.mobile}`);
    if (cols.tablet) classes.push(`md:grid-cols-${cols.tablet}`);
    if (cols.desktop) classes.push(`lg:grid-cols-${cols.desktop}`);
    if (cols.largeDesktop) classes.push(`xl:grid-cols-${cols.largeDesktop}`);
    
    return `grid gap-4 ${classes.join(' ')}`;
  }

  /**
   * Get spacing classes based on screen size
   */
  getSpacingClasses(): {
    padding: string;
    margin: string;
    gap: string;
  } {
    return {
      padding: 'p-4 lg:p-6',
      margin: 'm-4 lg:m-6',
      gap: 'gap-4 lg:gap-6'
    };
  }

  /**
   * Get animation classes
   */
  getAnimationClasses(): {
    sidebar: string;
    theme: string;
    fade: string;
    slide: string;
  } {
    return {
      sidebar: this.config.animations.sidebarTransition,
      theme: this.config.animations.themeTransition,
      fade: 'transition-opacity duration-300 ease-in-out',
      slide: 'transition-transform duration-300 ease-in-out'
    };
  }

  /**
   * Check if element should be hidden on mobile
   */
  shouldHideOnMobile(element: 'sidebar' | 'header-actions' | 'breadcrumbs'): boolean {
    const hideConfig = {
      sidebar: false, // Sidebar becomes overlay on mobile
      'header-actions': false, // Keep important actions visible
      breadcrumbs: true // Hide breadcrumbs on mobile to save space
    };

    return this.isMobile() && hideConfig[element];
  }

  /**
   * Get flex direction based on screen size
   */
  getFlexDirection(direction: { mobile?: string; desktop?: string }): string {
    const classes = [];
    
    if (direction.mobile) classes.push(`flex-${direction.mobile}`);
    if (direction.desktop) classes.push(`lg:flex-${direction.desktop}`);
    
    return `flex ${classes.join(' ')}`;
  }

  /**
   * Get text size classes based on screen size
   */
  getTextSizeClasses(size: { mobile?: string; desktop?: string }): string {
    const classes = [];
    
    if (size.mobile) classes.push(`text-${size.mobile}`);
    if (size.desktop) classes.push(`lg:text-${size.desktop}`);
    
    return classes.join(' ');
  }

  /**
   * Cleanup event listeners (call from component ngOnDestroy)
   */
  cleanup(): void {
    // In a real implementation, you'd store the event listener reference
    // and remove it here. For now, this is a placeholder.
  }
}

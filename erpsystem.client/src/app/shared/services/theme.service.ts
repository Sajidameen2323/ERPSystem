import { Injectable, signal, effect } from '@angular/core';

export interface ThemeConfig {
  light: {
    primary: string;
    secondary: string;
    background: {
      body: string;
      container: string;
      card: string;
      sidebar: string;
      header: string;
      footer: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: string;
  };
  dark: {
    primary: string;
    secondary: string;
    background: {
      body: string;
      container: string;
      card: string;
      sidebar: string;
      header: string;
      footer: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'darkMode';
  
  isDarkMode = signal(false);

  // Theme configuration with Tailwind classes
  private themeConfig: ThemeConfig = {
    light: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-gray-100 text-gray-900',
      background: {
        body: 'bg-gray-50',
        container: 'bg-gray-50',
        card: 'bg-white',
        sidebar: 'bg-white',
        header: 'bg-white',
        footer: 'bg-white'
      },
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-700',
        muted: 'text-gray-500'
      },
      border: 'border-gray-200'
    },
    dark: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-gray-700 text-gray-100',
      background: {
        body: 'bg-gray-900',
        container: 'bg-gray-900',
        card: 'bg-gray-800',
        sidebar: 'bg-gray-800',
        header: 'bg-gray-800',
        footer: 'bg-gray-800'
      },
      text: {
        primary: 'text-gray-100',
        secondary: 'text-gray-300',
        muted: 'text-gray-400'
      },
      border: 'border-gray-700'
    }
  };

  constructor() {
    this.loadThemePreference();
    this.setupThemeEffect();
  }

  /**
   * Load theme preference from localStorage
   */
  private loadThemePreference(): void {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme !== null) {
      this.isDarkMode.set(savedTheme === 'true');
    } else {
      this.isDarkMode.set(prefersDark);
    }
  }

  /**
   * Setup effect to apply theme changes to DOM and localStorage
   */
  private setupThemeEffect(): void {
    effect(() => {
      const darkMode = this.isDarkMode();
      
      // Apply/remove dark class to document
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Save preference to localStorage
      localStorage.setItem(this.STORAGE_KEY, darkMode.toString());
    });
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode(): void {
    this.isDarkMode.set(!this.isDarkMode());
  }

  /**
   * Set theme mode
   */
  setDarkMode(isDark: boolean): void {
    this.isDarkMode.set(isDark);
  }

  /**
   * Get current theme configuration
   */
  getCurrentTheme(): ThemeConfig['light'] | ThemeConfig['dark'] {
    return this.isDarkMode() ? this.themeConfig.dark : this.themeConfig.light;
  }

  /**
   * Get theme configuration for specific mode
   */
  getTheme(isDark: boolean): ThemeConfig['light'] | ThemeConfig['dark'] {
    return isDark ? this.themeConfig.dark : this.themeConfig.light;
  }

  /**
   * Get Tailwind classes for common elements
   */
  getClasses() {
    const theme = this.getCurrentTheme();
    return {
      // Container classes
      container: `${theme.background.container} ${theme.text.primary} transition-colors duration-300`,
      card: `${theme.background.card} ${theme.text.primary} ${theme.border} transition-colors duration-300`,
      
      // Layout classes
      sidebar: `${theme.background.sidebar} ${theme.text.primary} ${theme.border} transition-colors duration-300`,
      header: `${theme.background.header} ${theme.text.primary} ${theme.border} transition-colors duration-300`,
      footer: `${theme.background.footer} ${theme.text.primary} ${theme.border} transition-colors duration-300`,
      main: `${theme.background.body} transition-colors duration-300`,
      
      // Text classes
      textPrimary: theme.text.primary,
      textSecondary: theme.text.secondary,
      textMuted: theme.text.muted,
      
      // Button classes
      buttonPrimary: `${theme.primary} hover:bg-blue-700 focus:ring-blue-500 transition-colors duration-200`,
      buttonSecondary: `${theme.secondary} hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200`,
      
      // Border classes
      border: theme.border,
      
      // Utility classes
      darkModeClass: this.isDarkMode() ? 'dark' : '',
      backgroundBody: theme.background.body
    };
  }

  /**
   * Get responsive container class with theme
   */
  getContainerClass(): string {
    const base = 'flex h-screen overflow-hidden transition-colors duration-300';
    return `${base} ${this.isDarkMode() ? 'dark bg-gray-900' : 'bg-gray-50'}`;
  }

  /**
   * Update theme configuration (for customization)
   */
  updateThemeConfig(newConfig: Partial<ThemeConfig>): void {
    this.themeConfig = { ...this.themeConfig, ...newConfig };
  }
}

import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'darkMode';
  
  isDarkMode = signal(false);

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
  getCurrentTheme(): string {
    return this.isDarkMode() ? 'dark' : 'light';
  }

  /**
   * Get Tailwind classes for common elements using dark: prefix
   */
  getClasses() {
    return {
      // Container classes
      container: 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300',
      card: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 transition-colors duration-300',
      
      // Layout classes
      sidebar: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 transition-colors duration-300',
      header: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300',
      footer: 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300',
      main: 'bg-white dark:bg-gray-900 transition-colors duration-300',
      
      // Text classes
      textPrimary: 'text-gray-900 dark:text-gray-100',
      textSecondary: 'text-gray-700 dark:text-gray-300',
      textMuted: 'text-gray-500 dark:text-gray-400',
      
      // Button classes
      buttonPrimary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white focus:ring-blue-500 transition-colors duration-200',
      buttonSecondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors duration-200',
      
      // Border classes
      border: 'border-gray-200 dark:border-gray-700',
      
      // Utility classes
      darkModeClass: this.isDarkMode() ? 'dark' : '',
      backgroundBody: 'bg-gray-50 dark:bg-gray-900'
    };
  }
}

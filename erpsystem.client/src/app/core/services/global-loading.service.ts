import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalLoadingService {
  private _isLoading = signal<boolean>(false);
  private _loadingMessage = signal<string>('Loading...');

  // Public readonly signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly loadingMessage = this._loadingMessage.asReadonly();

  /**
   * Show global loading indicator
   */
  show(message: string = 'Loading...'): void {
    this._loadingMessage.set(message);
    this._isLoading.set(true);
  }

  /**
   * Hide global loading indicator
   */
  hide(): void {
    this._isLoading.set(false);
    this._loadingMessage.set('Loading...');
  }

  /**
   * Execute a function with global loading
   */
  withLoading<T>(
    fn: () => Promise<T>,
    message: string = 'Loading...'
  ): Promise<T> {
    this.show(message);
    return fn().finally(() => this.hide());
  }
}

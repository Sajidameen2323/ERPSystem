import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  isVisible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private toasts: Toast[] = [];

  success(title: string, message?: string, duration: number = 5000): void {
    this.addToast('success', title, message, duration);
  }

  error(title: string, message?: string, duration: number = 8000): void {
    this.addToast('error', title, message, duration);
  }

  warning(title: string, message?: string, duration: number = 6000): void {
    this.addToast('warning', title, message, duration);
  }

  info(title: string, message?: string, duration: number = 5000): void {
    this.addToast('info', title, message, duration);
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.toastsSubject.next([...this.toasts]);
  }

  clear(): void {
    this.toasts = [];
    this.toastsSubject.next([]);
  }

  private addToast(type: Toast['type'], title: string, message?: string, duration?: number): void {
    const id = this.generateId();
    const toast: Toast = {
      id,
      type,
      title,
      message,
      duration,
      isVisible: true
    };

    this.toasts.push(toast);
    this.toastsSubject.next([...this.toasts]);

    if (duration && duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

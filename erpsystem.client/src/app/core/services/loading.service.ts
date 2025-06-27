import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private loadingRequests = 0;

  show(): void {
    this.loadingRequests++;
    if (this.loadingRequests === 1) {
      this.loadingSubject.next(true);
    }
  }

  hide(): void {
    this.loadingRequests = Math.max(0, this.loadingRequests - 1);
    if (this.loadingRequests === 0) {
      this.loadingSubject.next(false);
    }
  }

  forceHide(): void {
    this.loadingRequests = 0;
    this.loadingSubject.next(false);
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}

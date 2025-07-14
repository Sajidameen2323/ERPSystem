import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap, finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { GlobalLoadingService } from '../services/global-loading.service';
import { User } from '../models/user.interface';

@Injectable({ providedIn: 'root' })
export class CurrentUserResolver implements Resolve<User | null> {
  constructor(
    private authService: AuthService,
    private globalLoadingService: GlobalLoadingService
  ) {}

  resolve(): Observable<User | null> {
    this.globalLoadingService.show('Loading user profile...');
    
    return this.authService.getCurrentUserProfile().pipe(
      map(result => (result.isSuccess && result.data ? result.data : null)),
      finalize(() => this.globalLoadingService.hide())
    );
  }
}

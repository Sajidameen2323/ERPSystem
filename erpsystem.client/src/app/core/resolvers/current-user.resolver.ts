import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.interface';

@Injectable({ providedIn: 'root' })
export class CurrentUserResolver implements Resolve<User | null> {
  constructor(private authService: AuthService) {}

  resolve(): Observable<User | null> {
    return this.authService.getCurrentUserProfile().pipe(
      map(result => (result.isSuccess && result.data ? result.data : null))
    );
  }
}

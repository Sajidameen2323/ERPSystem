import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Result, DashboardStats, DashboardConfig, RecentActivity } from '../models';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private httpService: HttpService) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.httpService.get<DashboardStats>('/dashboard/stats')
      .pipe(map(result => result.data!));
  }

  getDashboardConfig(): Observable<DashboardConfig> {
    return this.httpService.get<DashboardConfig>('/dashboard/config')
      .pipe(map(result => result.data!));
  }

  updateDashboardConfig(config: DashboardConfig): Observable<DashboardConfig> {
    return this.httpService.put<DashboardConfig>('/dashboard/config', config)
      .pipe(map(result => result.data!));
  }

  getRecentActivities(count: number = 10): Observable<RecentActivity[]> {
    return this.httpService.get<RecentActivity[]>(`/dashboard/activities`, { count })
      .pipe(map(result => result.data!));
  }
}

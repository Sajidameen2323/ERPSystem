import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Result, PagedResult, PaginationParams } from '../models';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // GET request
  get<T>(endpoint: string, params?: any): Observable<Result<T>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<Result<T>>(`${this.baseUrl}${endpoint}`, { 
      params: httpParams,
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // GET request for paged results
  getPaged<T>(endpoint: string, pagination: PaginationParams): Observable<Result<PagedResult<T>>> {
    let httpParams = new HttpParams()
      .set('page', pagination.page.toString())
      .set('pageSize', pagination.pageSize.toString());

    if (pagination.searchTerm) {
      httpParams = httpParams.set('searchTerm', pagination.searchTerm);
    }
    if (pagination.sortBy) {
      httpParams = httpParams.set('sortBy', pagination.sortBy);
    }
    if (pagination.sortDirection) {
      httpParams = httpParams.set('sortDirection', pagination.sortDirection);
    }

    return this.http.get<Result<PagedResult<T>>>(`${this.baseUrl}${endpoint}`, { 
      params: httpParams,
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // POST request
  post<T>(endpoint: string, data: any): Observable<Result<T>> {
    return this.http.post<Result<T>>(`${this.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // PUT request
  put<T>(endpoint: string, data: any): Observable<Result<T>> {
    return this.http.put<Result<T>>(`${this.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // DELETE request
  delete<T>(endpoint: string): Observable<Result<T>> {
    return this.http.delete<Result<T>>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors && Array.isArray(error.error.errors)) {
        errorMessage = error.error.errors.join(', ');
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized access. Please login again.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      }
    }

    return throwError(() => ({ message: errorMessage, status: error.status }));
  };
}

import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

export const caseConversionInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body) {
        const convertedBody = convertObjectCase(event.body);
        return event.clone({ body: convertedBody });
      }
      return event;
    })
  );
};

/**
 * Converts object keys from PascalCase to camelCase recursively
 */
function convertObjectCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertObjectCase(item));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = toCamelCase(key);
        converted[camelKey] = convertObjectCase(obj[key]);
      }
    }
    return converted;
  }

  return obj;
}

/**
 * Converts PascalCase string to camelCase
 */
function toCamelCase(str: string): string {
  if (!str) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

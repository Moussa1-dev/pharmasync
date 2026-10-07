import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('pharma_token');

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && token && !req.url.includes('/api/auth/')) {
        localStorage.removeItem('pharma_token');
        localStorage.removeItem('pharma_role');
        localStorage.removeItem('pharma_email');
        localStorage.removeItem('pharma_user_id');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

const redirectToLogin = (router: Router, attemptedUrl: string): false => {
  router.navigate(['/login'], {
    queryParams: { returnUrl: attemptedUrl },
    replaceUrl: true
  });
  return false;
};

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('pharma_token');

  if (!token) {
    localStorage.removeItem('pharma_role');
    return redirectToLogin(router, state.url);
  }

  return true;
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (_route, state) => {
    const router = inject(Router);
    const token = localStorage.getItem('pharma_token');
    const role = localStorage.getItem('pharma_role');

    if (!token) {
      return redirectToLogin(router, state.url);
    }

    if (role && allowedRoles.includes(role)) {
      return true;
    }

    router.navigate(['/home'], {
      queryParams: { access: 'denied' },
      replaceUrl: true
    });
    return false;
  };
};

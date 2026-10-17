import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';

// Convenience only: Row Level Security in Supabase protects the data itself
export const authGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  await auth.ready;
  return auth.user() ? true : router.parseUrl('/anmelden');
};

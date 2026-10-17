import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
  {
    path: '',
    title: 'Finance-Demo',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: 'uebersicht',
    title: 'Übersicht · Finance-Demo',
    loadComponent: () => import('./overview/overview').then((m) => m.Overview),
  },
  {
    path: 'anmelden',
    title: 'Anmelden · Finance-Demo',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'einkommen',
    title: 'Einkommen · Finance-Demo',
    canActivate: [authGuard],
    loadComponent: () => import('./income/income').then((m) => m.Income),
  },
  { path: '**', redirectTo: '' },
];

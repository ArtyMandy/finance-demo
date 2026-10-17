import { Routes } from '@angular/router';

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
  { path: '**', redirectTo: '' },
];

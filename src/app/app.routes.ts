import { Routes } from '@angular/router';

const title = (page: string) => `${page} · Finanz-demo`;

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: title('Übersicht'),
    loadComponent: () => import('./overview/overview').then((m) => m.Overview),
  },
  {
    path: 'ziele',
    title: title('Sparziele'),
    loadComponent: () => import('./goals/goals').then((m) => m.Goals),
  },
  {
    path: 'vertraege',
    title: title('Verträge & Abos'),
    loadComponent: () => import('./contracts/contracts').then((m) => m.Contracts),
  },
  {
    path: 'anlage',
    title: title('Geldanlage'),
    loadComponent: () => import('./invest/invest').then((m) => m.Invest),
  },
  {
    path: 'buchungen',
    title: title('Buchungen'),
    loadComponent: () => import('./transactions/transactions').then((m) => m.Transactions),
  },
  {
    path: 'konten',
    title: title('Konten'),
    loadComponent: () => import('./accounts/accounts').then((m) => m.Accounts),
  },
  {
    path: 'einnahmen',
    title: title('Einnahmen & Fixkosten'),
    loadComponent: () => import('./income/income').then((m) => m.Income),
  },
  {
    path: 'budgets',
    title: title('Budgets'),
    loadComponent: () => import('./budgets/budgets').then((m) => m.Budgets),
  },
  {
    path: 'auswertung',
    title: title('Auswertung'),
    loadComponent: () => import('./analysis/analysis').then((m) => m.Analysis),
  },
  {
    path: 'steuern',
    title: title('Steuer-Helfer'),
    loadComponent: () => import('./taxes/taxes').then((m) => m.Taxes),
  },
  {
    path: 'altersvorsorge',
    title: title('Altersvorsorge'),
    loadComponent: () => import('./pension/pension').then((m) => m.Pension),
  },
  {
    path: 'vorsorgevermoegen',
    title: title('Vorsorgevermögen'),
    loadComponent: () =>
      import('./retirement-assets/retirement-assets').then((m) => m.RetirementAssets),
  },
  {
    path: 'wissen',
    title: title('Anlage-Wissen'),
    loadComponent: () => import('./knowledge/knowledge').then((m) => m.Knowledge),
  },
  {
    path: 'profil',
    title: title('Profil & Daten'),
    loadComponent: () => import('./profile/profile').then((m) => m.Profile),
  },
  {
    path: 'anmelden',
    title: title('Anmelden'),
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'playground',
    title: title('Playground'),
    loadComponent: () => import('./playground/playground').then((m) => m.Playground),
  },
  { path: 'einkommen', redirectTo: 'einnahmen' },
  { path: 'uebersicht', redirectTo: '' },
  { path: '**', redirectTo: '' },
];

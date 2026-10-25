export interface NavItem {
  path: string;
  label: string;
  /** SVG path data, 24×24 stroke icons. */
  icon: string[];
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { path: '/', label: 'Übersicht', icon: ['M3 11l9-7 9 7', 'M5 10v10h14V10'] },
  {
    path: '/ziele',
    label: 'Ziele',
    icon: [
      'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18',
      'M12 7a5 5 0 1 0 0 10 5 5 0 1 0 0-10',
      'M12 11.5v1',
    ],
  },
  { path: '/vertraege', label: 'Verträge', icon: ['M6 3h9l3 3v15H6z', 'M9 11h6', 'M9 15h6'] },
  { path: '/anlage', label: 'Anlage', icon: ['M3 17l6-6 4 4 8-8', 'M15 7h6v6'] },
];

export const SECONDARY_NAV: readonly NavItem[] = [
  { path: '/buchungen', label: 'Buchungen', icon: ['M4 6h16', 'M4 12h16', 'M4 18h10'] },
  { path: '/konten', label: 'Konten', icon: ['M3 7h18v12H3z', 'M3 11h18', 'M7 15h3'] },
  {
    path: '/einnahmen',
    label: 'Einnahmen & Fixkosten',
    icon: [
      'M12 3v18',
      'M17 7.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 2.6 5 3.2 5 1.4 5 3.3-2.2 3-5 3-5-1.1-5-3',
    ],
  },
  {
    path: '/budgets',
    label: 'Budgets',
    icon: ['M12 3a9 9 0 1 0 9 9h-9z', 'M15 3.5A9 9 0 0 1 20.5 9H15z'],
  },
  {
    path: '/auswertung',
    label: 'Auswertung',
    icon: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'],
  },
  {
    path: '/steuern',
    label: 'Steuer-Helfer',
    icon: ['M7 3h10v18l-5-3-5 3z', 'M10 9l4 4', 'M14 9l-4 4'],
  },
  {
    path: '/altersvorsorge',
    label: 'Altersvorsorge',
    icon: ['M4 10h16', 'M5 10v9h14v-9', 'M12 3l8 5H4z', 'M9 14v3', 'M15 14v3'],
  },
  {
    path: '/vorsorgevermoegen',
    label: 'Vorsorgevermögen',
    icon: ['M4 20h16', 'M6 20v-5h3v5', 'M10.5 20v-9h3v9', 'M15 20v-13h3v13', 'M5 9l5-4 4 3 5-4'],
  },
  {
    path: '/wissen',
    label: 'Anlage-Wissen',
    icon: ['M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z', 'M4 21V5'],
  },
  {
    path: '/profil',
    label: 'Profil & Daten',
    icon: ['M12 4a4 4 0 1 0 0 8 4 4 0 1 0 0-8', 'M4 21c0-4 3.6-6 8-6s8 2 8 6'],
  },
];

/** Test area for trying out features, e.g. notifications. */
export const PLAYGROUND_NAV: readonly NavItem[] = [
  {
    path: '/playground',
    label: 'Ausprobieren',
    icon: ['M6 16V11a6 6 0 0 1 12 0v5l2 2H4z', 'M10 21h4'],
  },
];

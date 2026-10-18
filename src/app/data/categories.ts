import type { CategoryRule } from './models';

export interface Category {
  id: string;
  name: string;
  /** Lower-case keywords matched against counterparty and purpose. */
  keywords: string[];
  /** Transfers and savings are neither income nor spending. */
  neutral?: boolean;
}

export const CATEGORIES: readonly Category[] = [
  {
    id: 'einkommen',
    name: 'Einkommen',
    keywords: [
      'gehalt',
      'lohn',
      'bezüge',
      'kindergeld',
      'familienkasse',
      'rente',
      'honorar',
      'erstattung',
      'steuererstattung',
      'finanzamt erstattung',
    ],
  },
  {
    id: 'versicherungen',
    name: 'Versicherungen',
    keywords: [
      '*versicherung',
      'allianz',
      'huk',
      'axa',
      'ergo',
      'generali',
      'debeka',
      'devk',
      'r+v',
      'haftpflicht',
      'hausrat',
      'krankenkasse',
      'aok',
      'barmer',
      'techniker',
      'dak',
    ],
  },
  {
    id: 'wohnen',
    name: 'Wohnen',
    keywords: [
      '*miete',
      'hausverwaltung',
      'nebenkosten',
      'wohnungsbau',
      'vermieter',
      'hausgeld',
      'grundsteuer',
      '*strom',
      'stadtwerke',
      'vattenfall',
      'eon',
      'e.on',
      'enbw',
      'gasversorgung',
      'rundfunk',
      'gez',
      'beitragsservice',
      'ikea',
      'obi',
      'hornbach',
      'bauhaus',
    ],
  },
  {
    id: 'lebensmittel',
    name: 'Lebensmittel',
    keywords: [
      'rewe',
      'edeka',
      'aldi',
      'lidl',
      'netto',
      'penny',
      'kaufland',
      'tegut',
      'denns',
      'alnatura',
      'bäckerei',
      'baeckerei',
      'metzgerei',
      'globus',
      'norma',
    ],
  },
  {
    id: 'mobilitaet',
    name: 'Mobilität',
    keywords: [
      'deutsche bahn',
      'db vertrieb',
      'bahn',
      'tankstelle',
      'aral',
      'shell',
      'esso',
      'jet ',
      'total',
      'bvg',
      'mvg',
      'hvv',
      'rmv',
      'vrs',
      'kvb',
      'deutschlandticket',
      'uber',
      'bolt',
      'flixbus',
      'sixt',
      'share now',
      'parkhaus',
      'kfz',
      'werkstatt',
      'atu',
    ],
  },
  {
    id: 'abos',
    name: 'Abos & Medien',
    keywords: [
      'netflix',
      'spotify',
      'disney',
      'amazon prime',
      'prime video',
      'dazn',
      'sky ',
      'wow ',
      'apple.com',
      'icloud',
      'google one',
      'youtube',
      'audible',
      'deezer',
      'tidal',
      'paramount',
      'rtl+',
      'joyn',
      'zeitung',
      'spiegel',
      'zeit online',
      'dropbox',
      'microsoft 365',
      'adobe',
    ],
  },
  {
    id: 'telekommunikation',
    name: 'Handy & Internet',
    keywords: [
      'telekom',
      '*handy',
      '*mobilfunk',
      'vodafone',
      'o2',
      'telefonica',
      '1&1',
      'congstar',
      'freenet',
      'mobilcom',
      'drillisch',
      'winsim',
      'fraenk',
    ],
  },
  {
    id: 'gesundheit',
    name: 'Gesundheit',
    keywords: [
      'apotheke',
      'arzt',
      'zahnarzt',
      'praxis',
      'optiker',
      'fielmann',
      'physio',
      'dm-drogerie',
      'dm drogerie',
      'rossmann',
      'müller drogerie',
    ],
  },
  {
    id: 'freizeit',
    name: 'Freizeit',
    keywords: [
      'fitness',
      'mcfit',
      'urban sports',
      'kino',
      'cinemaxx',
      'theater',
      'konzert',
      'eventim',
      'museum',
      'verein',
      'steam',
      'playstation',
      'nintendo',
      'xbox',
      'thalia',
      'hugendubel',
    ],
  },
  {
    id: 'restaurant',
    name: 'Essen gehen',
    keywords: [
      'restaurant',
      'lieferando',
      'wolt',
      'café',
      'cafe',
      'mcdonald',
      'burger king',
      'starbucks',
      'pizzeria',
      'imbiss',
      'kantine',
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    keywords: [
      'amazon',
      'zalando',
      'otto',
      'h&m',
      'zara',
      'mediamarkt',
      'saturn',
      'ebay',
      'paypal',
      'douglas',
      'tchibo',
      'decathlon',
      'primark',
      'about you',
    ],
  },
  {
    id: 'reisen',
    name: 'Reisen',
    keywords: [
      'hotel',
      'booking.com',
      'airbnb',
      'lufthansa',
      'eurowings',
      'ryanair',
      'condor',
      'tui',
      'expedia',
      'check24 reise',
      'ferienwohnung',
    ],
  },
  {
    id: 'bildung',
    name: 'Bildung & Kinder',
    keywords: [
      'kita',
      'schule',
      'kindergarten',
      'hochschule',
      'universität',
      'volkshochschule',
      'vhs',
      'nachhilfe',
      'udemy',
      'kurs',
    ],
  },
  {
    id: 'kredit',
    name: 'Kredite & Gebühren',
    keywords: [
      'kredit',
      'darlehen',
      'tilgung',
      'zinsen',
      'kontoführung',
      'entgelt',
      'gebühr',
      'abschluss',
    ],
  },
  {
    id: 'sparen',
    name: 'Sparen & Anlage',
    keywords: [
      'sparplan',
      'depot',
      'trade republic',
      'scalable',
      'comdirect',
      'consorsbank',
      'flatex',
      'bausparkasse',
      'bauspar',
      'wertpapier',
      'vl-sparen',
      'tagesgeld',
    ],
    neutral: true,
  },
  {
    id: 'umbuchung',
    name: 'Umbuchung',
    keywords: ['umbuchung', 'übertrag', 'uebertrag', 'eigenes konto'],
    neutral: true,
  },
  { id: 'sonstiges', name: 'Sonstiges', keywords: [] },
];

export const FALLBACK_CATEGORY = 'sonstiges';

const byId = new Map(CATEGORIES.map((category) => [category.id, category]));

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Keywords match at the start of a word, so "rewe" does not hit "Brewery" but "haftpflicht" still
 * finds "Haftpflichtversicherung". A leading "*" matches anywhere, for German compound endings.
 */
const matchers = new Map(
  CATEGORIES.map((category) => [
    category.id,
    category.keywords.map((keyword) =>
      keyword.startsWith('*')
        ? new RegExp(escape(keyword.slice(1).trim()))
        : new RegExp(`(^|[^a-zäöüß])${escape(keyword.trim())}`),
    ),
  ]),
);

export function categoryName(id: string): string {
  return byId.get(id)?.name ?? 'Sonstiges';
}

export function isNeutralCategory(id: string): boolean {
  return byId.get(id)?.neutral === true;
}

/** Lower-case counterparty without numbers and punctuation, used for rules and grouping. */
export function normalizeCounterparty(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0-9]+/g, ' ')
    .replace(/[^a-zäöüß&+.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ');
}

/**
 * Picks a category: first rules the user taught by correcting a booking, then keywords.
 * Income without a match lands in "Einkommen".
 */
export function categorize(
  booking: { counterparty: string; purpose: string; amount: number },
  rules: readonly CategoryRule[] = [],
): string {
  const counterparty = normalizeCounterparty(booking.counterparty);
  const learned = counterparty ? rules.find((rule) => rule.pattern === counterparty) : undefined;
  if (learned) return learned.categoryId;

  const haystack = ` ${booking.counterparty} ${booking.purpose} `.toLowerCase();
  for (const category of CATEGORIES) {
    if (
      booking.amount > 0 &&
      category.id !== 'einkommen' &&
      category.id !== 'umbuchung' &&
      category.id !== 'sparen'
    ) {
      continue;
    }
    if (matchers.get(category.id)?.some((matcher) => matcher.test(haystack))) return category.id;
  }
  return booking.amount > 0 ? 'einkommen' : FALLBACK_CATEGORY;
}

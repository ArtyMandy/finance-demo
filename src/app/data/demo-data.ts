import { categorize } from './categories';
import {
  emptyFinanceData,
  FinanceData,
  IsoDate,
  Month,
  RecurringItem,
  Transaction,
} from './models';
import { addMonths, daysInMonth, lastMonths } from './months';

/** Deterministic pseudo random numbers so demo data looks the same every time. */
function random(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

const day = (month: Month, dayOfMonth: number): IsoDate =>
  `${month}-${String(Math.min(dayOfMonth, daysInMonth(month))).padStart(2, '0')}`;

/** Sample data for trying the app: twelve months of bookings, contracts, goals and a depot. */
export function createDemoData(today: IsoDate): FinanceData {
  const month = today.slice(0, 7);
  const rand = random(42);
  const months = lastMonths(month, 12);
  const firstMonth = months[0];

  const recurring = (
    item: Partial<RecurringItem> & Pick<RecurringItem, 'name' | 'amount' | 'kind'>,
    id: string,
  ): RecurringItem => ({
    id,
    seriesId: id,
    rhythm: 'monthly',
    from: firstMonth,
    to: '',
    categoryId: categorize({
      counterparty: item.provider ?? '',
      purpose: item.name,
      amount: item.kind === 'income' ? 1 : -1,
    }),
    provider: '',
    customerNumber: '',
    cancelBy: '',
    monthlyCancelable: false,
    status: 'active',
    ...item,
  });

  const raiseMonth = addMonths(month, -4);
  const recurringItems: RecurringItem[] = [
    recurring(
      {
        kind: 'income',
        name: 'Gehalt',
        amount: 3450,
        to: addMonths(raiseMonth, -1),
        categoryId: 'einkommen',
        seriesId: 'salary',
      },
      'salary-1',
    ),
    recurring(
      {
        kind: 'income',
        name: 'Gehalt',
        amount: 3600,
        from: raiseMonth,
        categoryId: 'einkommen',
        seriesId: 'salary',
      },
      'salary-2',
    ),
    recurring(
      { kind: 'income', name: 'Kindergeld', amount: 255, categoryId: 'einkommen' },
      'kindergeld',
    ),
    recurring(
      {
        kind: 'expense',
        name: 'Miete',
        amount: 1150,
        provider: 'Hausverwaltung Nord',
        categoryId: 'wohnen',
      },
      'rent',
    ),
    recurring(
      {
        kind: 'expense',
        name: 'Strom',
        amount: 78,
        provider: 'Stadtwerke',
        categoryId: 'wohnen',
        cancelBy: day(addMonths(month, 2), 28),
      },
      'power',
    ),
    recurring(
      {
        kind: 'expense',
        name: 'Netflix',
        amount: 13.99,
        provider: 'Netflix',
        monthlyCancelable: true,
      },
      'netflix',
    ),
    recurring(
      {
        kind: 'expense',
        name: 'Disney+',
        amount: 9.99,
        provider: 'Disney+',
        monthlyCancelable: true,
      },
      'disney',
    ),
    recurring(
      {
        kind: 'expense',
        name: 'Spotify',
        amount: 10.99,
        provider: 'Spotify',
        monthlyCancelable: true,
      },
      'spotify',
    ),
    recurring(
      {
        kind: 'expense',
        name: 'Fitnessstudio',
        amount: 39.9,
        provider: 'FitX',
        categoryId: 'freizeit',
        cancelBy: day(month, Math.min(28, Number(today.slice(8, 10)) + 12)),
      },
      'gym',
    ),
    recurring(
      {
        kind: 'expense',
        name: 'Handyvertrag',
        amount: 34.99,
        provider: 'Telekom',
        customerNumber: '123456789',
        cancelBy: day(addMonths(month, 3), 15),
      },
      'phone',
    ),
    recurring(
      {
        kind: 'expense',
        name: 'Haftpflichtversicherung',
        amount: 64.8,
        rhythm: 'yearly',
        provider: 'HUK-Coburg',
        from: addMonths(month, -9),
      },
      'liability',
    ),
    recurring(
      {
        kind: 'expense',
        name: 'Kfz-Versicherung',
        amount: 189,
        rhythm: 'quarterly',
        provider: 'Allianz',
        categoryId: 'versicherungen',
        from: addMonths(month, -11),
      },
      'car-insurance',
    ),
  ];

  const transactions: Transaction[] = [];
  let counter = 0;
  const add = (date: IsoDate, amount: number, counterparty: string, purpose = '') => {
    if (date > today) return;
    transactions.push({
      id: `demo-${++counter}`,
      accountId: 'giro',
      date,
      amount: Math.round(amount * 100) / 100,
      counterparty,
      purpose,
      categoryId: categorize({ counterparty, purpose, amount }),
      categoryManual: false,
      importKey: '',
    });
  };

  for (const m of months) {
    add(day(m, 1), m >= raiseMonth ? 3600 : 3450, 'Muster GmbH', 'Gehalt');
    add(day(m, 5), 255, 'Familienkasse', 'Kindergeld');
    add(day(m, 2), -1150, 'Hausverwaltung Nord', 'Miete');
    add(day(m, 3), -78, 'Stadtwerke', 'Abschlag Strom');
    add(day(m, 8), -13.99, 'Netflix', 'Abo');
    add(day(m, 12), -9.99, 'Disney Plus', 'Abo');
    add(day(m, 15), -10.99, 'Spotify', 'Premium');
    add(day(m, 1), -39.9, 'FitX Fitness', 'Mitgliedsbeitrag');
    add(day(m, 20), -34.99, 'Telekom Deutschland', 'Mobilfunk');
    add(day(m, 25), -300, 'Eigenes Konto', 'Umbuchung Tagesgeld');
    add(day(m, 26), -250, 'Trade Republic', 'Sparplan ETF');
    for (let i = 0; i < 9; i++) {
      const shops = ['REWE', 'EDEKA', 'ALDI SÜD', 'Lidl', 'dm-drogerie markt'];
      add(
        day(m, 2 + i * 3),
        -(18 + rand() * 55),
        shops[Math.floor(rand() * shops.length)],
        'Kartenzahlung',
      );
    }
    add(day(m, 9), -(40 + rand() * 30), 'ARAL Tankstelle', 'Kartenzahlung');
    add(day(m, 14), -49, 'Deutsche Bahn', 'Deutschlandticket');
    add(day(m, 17), -(25 + rand() * 60), 'Lieferando', 'Bestellung');
    add(day(m, 22), -(30 + rand() * 90), 'Amazon', 'Bestellung');
    add(day(m, 23), -(15 + rand() * 30), 'Cinemaxx', 'Kino');
  }
  // A larger purchase two weeks ago for the "unusual expense" hint.
  add(day(month, Math.max(1, Number(today.slice(8, 10)) - 3)), -429, 'MediaMarkt', 'Waschmaschine');
  const yearlyMonth = addMonths(month, -9);
  add(day(yearlyMonth, 10), -64.8, 'HUK-Coburg Versicherung', 'Haftpflicht');
  for (const offset of [-11, -8, -5, -2])
    add(day(addMonths(month, offset), 11), -189, 'Allianz Versicherung', 'Kfz');

  const data = emptyFinanceData();
  return {
    ...data,
    updatedAt: new Date().toISOString(),
    profile: {
      name: 'Max Mustermann',
      street: 'Musterstraße 1',
      city: '12345 Musterstadt',
      jointAssessment: false,
      churchTax: 0,
      children: 1,
    },
    accounts: [
      {
        id: 'giro',
        name: 'Girokonto',
        type: 'giro',
        institution: 'ING',
        openingBalance: 2100,
        valuations: [],
      },
      {
        id: 'tagesgeld',
        name: 'Tagesgeld',
        type: 'tagesgeld',
        institution: 'ING',
        openingBalance: 5200,
        valuations: [],
      },
      {
        id: 'depot',
        name: 'Depot',
        type: 'depot',
        institution: 'Trade Republic',
        openingBalance: 0,
        valuations: months.map((m, index) => ({
          date: day(m, 28),
          value: 18000 + index * 420 + Math.round(rand() * 600),
        })),
      },
      {
        id: 'auto',
        name: 'Auto',
        type: 'sachwert',
        institution: '',
        openingBalance: 0,
        valuations: [{ date: day(firstMonth, 1), value: 9500 }],
      },
      {
        id: 'kfw',
        name: 'Studienkredit',
        type: 'kredit',
        institution: 'KfW',
        openingBalance: 0,
        valuations: [
          { date: day(firstMonth, 1), value: 4200 },
          { date: day(addMonths(month, -1), 1), value: 3400 },
        ],
      },
    ],
    transactions: [
      ...transactions,
      ...months
        .map((m, index) => ({
          id: `demo-tg-${index}`,
          accountId: 'tagesgeld',
          date: day(m, 25),
          amount: 300,
          counterparty: 'Girokonto',
          purpose: 'Umbuchung',
          categoryId: 'umbuchung',
          categoryManual: false,
          importKey: '',
        }))
        .filter((tx) => tx.date <= today),
    ],
    recurring: recurringItems,
    budgets: [
      { categoryId: 'lebensmittel', limit: 400 },
      { categoryId: 'restaurant', limit: 60 },
      { categoryId: 'shopping', limit: 150 },
    ],
    goals: [
      {
        id: 'goal-1',
        name: 'Notgroschen',
        target: 9000,
        targetMonth: addMonths(month, 8),
        saved: 6000,
        achievedMonth: '',
      },
      {
        id: 'goal-2',
        name: 'Urlaub Japan',
        target: 4000,
        targetMonth: addMonths(month, 10),
        saved: 1800,
        achievedMonth: '',
      },
      {
        id: 'goal-3',
        name: 'Neues Auto',
        target: 15000,
        targetMonth: addMonths(month, 38),
        saved: 3200,
        achievedMonth: '',
      },
      {
        id: 'goal-4',
        name: 'Neuer Laptop',
        target: 1400,
        targetMonth: addMonths(month, -7),
        saved: 1400,
        achievedMonth: addMonths(month, -7),
      },
    ],
    holdings: [
      {
        id: 'h1',
        accountId: 'depot',
        name: 'MSCI World ETF',
        isin: 'IE00B4L5Y983',
        assetType: 'etf',
        quantity: 160,
        buyPrice: 82.5,
        currentPrice: 104.2,
        savingsPlan: 200,
      },
      {
        id: 'h2',
        accountId: 'depot',
        name: 'Emerging Markets ETF',
        isin: 'IE00BKM4GZ66',
        assetType: 'etf',
        quantity: 120,
        buyPrice: 29.1,
        currentPrice: 33.4,
        savingsPlan: 50,
      },
      {
        id: 'h3',
        accountId: 'depot',
        name: 'Bundesanleihe 2030',
        isin: 'DE0001102507',
        assetType: 'anleihe',
        quantity: 20,
        buyPrice: 98.4,
        currentPrice: 99.1,
        savingsPlan: 0,
      },
    ],
    dividends: [
      { id: 'd1', holdingId: 'h1', date: day(addMonths(month, -4), 15), amount: 86.4 },
      { id: 'd2', holdingId: 'h2', date: day(addMonths(month, -3), 20), amount: 31.2 },
    ],
    exemptionOrders: [
      { id: 'fsa-1', institution: 'ING', amount: 500, expectedIncome: 180 },
      { id: 'fsa-2', institution: 'Trade Republic', amount: 300, expectedIncome: 520 },
    ],
    pension: [
      {
        id: 'p1',
        type: 'gesetzlich',
        name: 'Deutsche Rentenversicherung',
        expectedMonthly: 1480,
        monthlyContribution: 0,
      },
      {
        id: 'p2',
        type: 'betrieblich',
        name: 'Direktversicherung',
        expectedMonthly: 210,
        monthlyContribution: 100,
      },
    ],
  };
}

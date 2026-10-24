import {
  accountBalance,
  dueItems,
  monthlyInflow,
  monthTotals,
  spendingByCategory,
  wealthBreakdown,
  wealthHistory,
  wealthTotal,
} from './analytics';
import { categorize } from './categories';
import { detectContracts, duplicateSubscriptions, upcomingDeadlines } from './insights';
import { emptyFinanceData, FinanceData, RecurringItem, Transaction } from './models';
import { addMonths, monthsBetween } from './months';
import { amountInMonth, fixedCostsPerMonth, monthlyEquivalent } from './recurring';

function item(partial: Partial<RecurringItem>): RecurringItem {
  return {
    id: partial.name ?? 'x',
    seriesId: partial.name ?? 'x',
    kind: 'expense',
    name: 'Test',
    amount: 10,
    rhythm: 'monthly',
    from: '2026-01',
    to: '',
    categoryId: 'sonstiges',
    targetAccountId: '',
    provider: '',
    customerNumber: '',
    cancelBy: '',
    monthlyCancelable: false,
    status: 'active',
    ...partial,
  };
}

let counter = 0;
function tx(partial: Partial<Transaction>): Transaction {
  return {
    id: `t${++counter}`,
    accountId: 'giro',
    date: '2026-10-01',
    amount: -10,
    counterparty: '',
    purpose: '',
    categoryId: 'sonstiges',
    categoryManual: false,
    importKey: '',
    ...partial,
  };
}

function data(partial: Partial<FinanceData>): FinanceData {
  return { ...emptyFinanceData(), ...partial };
}

describe('months', () => {
  it('lists months across a year boundary', () => {
    expect(monthsBetween('2026-11', '2027-02')).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
    expect(monthsBetween('2026-03', '2026-02')).toEqual([]);
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });
});

describe('recurring items', () => {
  it('books monthly, quarterly, yearly and one-off amounts in the right months', () => {
    expect(amountInMonth(item({ rhythm: 'monthly' }), '2026-05')).toBe(10);
    expect(amountInMonth(item({ rhythm: 'quarterly' }), '2026-04')).toBe(10);
    expect(amountInMonth(item({ rhythm: 'quarterly' }), '2026-05')).toBe(0);
    expect(amountInMonth(item({ rhythm: 'yearly' }), '2027-01')).toBe(10);
    expect(amountInMonth(item({ rhythm: 'once' }), '2026-01')).toBe(10);
    expect(amountInMonth(item({ rhythm: 'once' }), '2026-02')).toBe(0);
  });

  it('respects from and to months', () => {
    expect(amountInMonth(item({ from: '2026-06', to: '2026-08' }), '2026-05')).toBe(0);
    expect(amountInMonth(item({ from: '2026-06', to: '2026-08' }), '2026-08')).toBe(10);
    expect(amountInMonth(item({ from: '2026-06', to: '2026-08' }), '2026-09')).toBe(0);
  });

  it('averages fixed costs per month', () => {
    expect(monthlyEquivalent(item({ amount: 120, rhythm: 'yearly' }))).toBe(10);
    const items = [
      item({ name: 'a', amount: 100 }),
      item({ name: 'b', amount: 30, rhythm: 'quarterly' }),
      item({ name: 'c', kind: 'income', amount: 999 }),
    ];
    expect(fixedCostsPerMonth(items, '2026-05')).toBe(110);
  });
});

describe('categorize', () => {
  it('finds categories by keyword, also inside German compound words', () => {
    expect(categorize({ counterparty: 'REWE Markt GmbH', purpose: '', amount: -20 })).toBe(
      'lebensmittel',
    );
    expect(
      categorize({ counterparty: 'HUK', purpose: 'Haftpflichtversicherung', amount: -60 }),
    ).toBe('versicherungen');
    expect(
      categorize({ counterparty: 'Muster GmbH', purpose: 'Gehalt Oktober', amount: 3000 }),
    ).toBe('einkommen');
    expect(categorize({ counterparty: 'Unbekannt', purpose: '', amount: -5 })).toBe('sonstiges');
  });

  it('prefers rules learned from corrections', () => {
    const rules = [{ pattern: 'bäckerei schmidt', categoryId: 'restaurant' }];
    expect(categorize({ counterparty: 'Bäckerei Schmidt', purpose: '', amount: -4 }, rules)).toBe(
      'restaurant',
    );
  });
});

describe('analytics', () => {
  const finance = data({
    accounts: [
      {
        id: 'giro',
        name: 'Giro',
        type: 'giro',
        retirement: false,
        linkedLoanId: '',
        institution: '',
        openingBalance: 1000,
        valuations: [{ date: '2026-09-30', value: 2500 }],
      },
      {
        id: 'depot',
        name: 'Depot',
        type: 'depot',
        retirement: false,
        linkedLoanId: '',
        institution: '',
        openingBalance: 0,
        valuations: [{ date: '2026-01-01', value: 5000 }],
      },
      {
        id: 'loan',
        name: 'Kredit',
        type: 'kredit',
        retirement: false,
        linkedLoanId: '',
        institution: '',
        openingBalance: 0,
        valuations: [{ date: '2026-01-01', value: 2000 }],
      },
    ],
    transactions: [
      tx({ amount: 3000, categoryId: 'einkommen', counterparty: 'Muster GmbH' }),
      tx({ amount: -1000, categoryId: 'wohnen', counterparty: 'Hausverwaltung' }),
      tx({ amount: -500, categoryId: 'umbuchung', counterparty: 'Eigenes Konto' }),
    ],
    recurring: [
      item({ name: 'Miete', amount: 1000, categoryId: 'wohnen' }),
      item({ name: 'Handy', amount: 30 }),
      item({ name: 'Gehalt', kind: 'income', amount: 3000 }),
    ],
  });

  it('takes balances from entered values, not from bookings, with loans as debt', () => {
    expect(accountBalance(finance, finance.accounts[0])).toBe(2500);
    expect(accountBalance(finance, finance.accounts[0], '2026-09-01')).toBe(1000);
    expect(wealthBreakdown(finance)).toMatchObject({
      cash: 2500,
      investments: 5000,
      debts: 2000,
      total: 5500,
    });
  });

  it('computes income and expenses from the defined items, ignoring bookings', () => {
    expect(monthTotals(finance, '2026-10')).toEqual({ income: 3000, expenses: 1030, savings: 0 });
    expect(monthTotals(finance, '2025-12')).toEqual({ income: 0, expenses: 0, savings: 0 });
    expect(spendingByCategory(finance, '2026-10')).toEqual([
      { categoryId: 'wohnen', amount: 1000 },
      { categoryId: 'sonstiges', amount: 30 },
    ]);
  });

  it('counts expenses to an own account or depot as savings, not spending', () => {
    const withSavings = {
      ...finance,
      recurring: [
        ...finance.recurring,
        item({ name: 'ETF', amount: 600, rhythm: 'quarterly', targetAccountId: 'depot' }),
      ],
    };
    expect(monthTotals(withSavings, '2026-10')).toEqual({
      income: 3000,
      expenses: 1030,
      savings: 600,
    });
    expect(spendingByCategory(withSavings, '2026-10').map((e) => e.amount)).toEqual([1000, 30]);
    expect(fixedCostsPerMonth(withSavings.recurring, '2026-10')).toBe(1030);
    expect(monthlyInflow(withSavings, 'depot', '2026-10')).toBe(200);
  });

  it('leaves assets or debts out of the net worth on request', () => {
    const wealth = { cash: 1000, investments: 500, other: 300, debts: 200, total: 1600 };
    const all = { includeAssets: true, includeDebts: true, includeRetirement: true };
    expect(wealthTotal(wealth, all)).toBe(1600);
    expect(wealthTotal(wealth, { ...all, includeAssets: false })).toBe(1300);
    expect(wealthTotal(wealth, { ...all, includeDebts: false })).toBe(1800);
    const options = { ...all, includeDebts: false };
    expect(wealthHistory(finance, ['2026-10'], '2026-10', options)).toEqual([7500]);
  });

  it('lists the items due in a month, income first', () => {
    expect(dueItems(finance, '2026-10').map((entry) => entry.item.name)).toEqual([
      'Gehalt',
      'Miete',
      'Handy',
    ]);
  });
});

describe('insights', () => {
  it('detects monthly payments with a stable amount', () => {
    const transactions = ['2026-07-03', '2026-08-03', '2026-09-03', '2026-10-03'].map((date) =>
      tx({ date, amount: -12.99, counterparty: 'Spotify AB' }),
    );
    const suggestions = detectContracts(data({ transactions }));
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      kind: 'expense',
      rhythm: 'monthly',
      amount: 12.99,
      firstMonth: '2026-07',
    });
  });

  it('detects recurring income unless an income with that amount is defined', () => {
    const transactions = ['2026-08-01', '2026-09-01', '2026-10-01'].map((date) =>
      tx({ date, amount: 3000, counterparty: 'Muster GmbH', categoryId: 'einkommen' }),
    );
    expect(detectContracts(data({ transactions }))[0]).toMatchObject({
      key: '+muster gmbh',
      kind: 'income',
      amount: 3000,
    });
    const recurring = [item({ name: 'Gehalt', kind: 'income', amount: 3000 })];
    expect(detectContracts(data({ transactions, recurring }))).toEqual([]);
  });

  it('ignores irregular amounts, transfers and dismissed suggestions', () => {
    const irregular = ['2026-07-03', '2026-08-03', '2026-09-03'].map((date, i) =>
      tx({ date, amount: -(20 + i * 30), counterparty: 'Amazon' }),
    );
    const transfers = ['2026-07-25', '2026-08-25', '2026-09-25'].map((date) =>
      tx({ date, amount: -300, counterparty: 'Eigenes Konto', categoryId: 'umbuchung' }),
    );
    expect(detectContracts(data({ transactions: [...irregular, ...transfers] }))).toEqual([]);
  });

  it('finds similar streaming subscriptions', () => {
    const groups = duplicateSubscriptions(
      data({
        recurring: [
          item({ name: 'Netflix', amount: 13.99 }),
          item({ name: 'Disney+', amount: 9.99 }),
        ],
      }),
      '2026-10',
    );
    expect(groups[0].label).toBe('Streaming');
    expect(groups[0].monthlySaving).toBeCloseTo(13.99);
  });

  it('lists cancellation deadlines within 30 days', () => {
    const finance = data({
      recurring: [
        item({ name: 'Gym', cancelBy: '2026-11-01' }),
        item({ name: 'Later', cancelBy: '2027-03-01' }),
      ],
    });
    expect(upcomingDeadlines(finance, '2026-10-18').map((i) => i.name)).toEqual(['Gym']);
  });
});

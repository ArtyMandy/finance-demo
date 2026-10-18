import { TestBed } from '@angular/core/testing';
import { Clock } from '../core/clock';
import { FinanceStore } from './finance-store';
import { parseIngCsv } from './ing-csv';
import { RecurringItem } from './models';

const CSV = [
  'IBAN;DE00 1234',
  'Buchung;Wertstellungsdatum;Auftraggeber/Empfänger;Buchungstext;Verwendungszweck;Saldo;Währung;Betrag;Währung',
  '02.10.2026;02.10.2026;Bäckerei Schmidt;Lastschrift;Brötchen;1.000,00;EUR;-4,50;EUR',
  '01.10.2026;01.10.2026;Bäckerei Schmidt;Lastschrift;Kuchen;1.004,50;EUR;-12,00;EUR',
].join('\n');

const salary: RecurringItem = {
  id: 'salary',
  seriesId: 'salary',
  kind: 'income',
  name: 'Gehalt',
  amount: 3000,
  rhythm: 'monthly',
  from: '2026-01',
  to: '',
  categoryId: 'einkommen',
  provider: '',
  customerNumber: '',
  cancelBy: '',
  monthlyCancelable: false,
  status: 'active',
};

describe('FinanceStore', () => {
  let store: FinanceStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    TestBed.inject(Clock).today.set('2026-10-18');
    store = TestBed.inject(FinanceStore);
    store.save('accounts', {
      id: 'giro',
      name: 'Giro',
      type: 'giro',
      institution: 'ING',
      openingBalance: 0,
      valuations: [],
    });
  });

  it('saves every change to localStorage right away', () => {
    expect(JSON.parse(localStorage.getItem('finanz-demo:data:v1')!).accounts).toHaveLength(1);
  });

  it('starts a new period when an amount changes, keeping the history', () => {
    store.save('recurring', salary);
    store.changeAmountFrom(salary, '2026-07', 3200);

    const periods = store.data().recurring;
    expect(periods).toHaveLength(2);
    expect(periods[0]).toMatchObject({ amount: 3000, from: '2026-01', to: '2026-06' });
    expect(periods[1]).toMatchObject({ amount: 3200, from: '2026-07', to: '', seriesId: 'salary' });
  });

  it('skips bookings that were imported before', () => {
    const { bookings } = parseIngCsv(CSV);
    expect(store.importBookings('giro', bookings)).toEqual({ added: 2, skipped: 0 });
    expect(store.importBookings('giro', bookings)).toEqual({ added: 0, skipped: 2 });
    expect(store.data().transactions).toHaveLength(2);
  });

  it('learns category corrections for the same counterparty', () => {
    store.importBookings('giro', parseIngCsv(CSV).bookings);
    const [first, second] = store.data().transactions;
    expect(first.categoryId).toBe('lebensmittel');

    store.setCategory(first.id, 'restaurant');

    const updated = store.data().transactions.find((tx) => tx.id === second.id)!;
    expect(updated.categoryId).toBe('restaurant');
    expect(store.data().categoryRules).toEqual([
      { pattern: 'bäckerei schmidt', categoryId: 'restaurant' },
    ]);
  });

  it('marks a goal as reached once the target is saved', () => {
    store.save('goals', {
      id: 'g',
      name: 'Urlaub',
      target: 1000,
      targetMonth: '2027-06',
      saved: 900,
      achievedMonth: '',
    });
    store.deposit(store.data().goals[0], 100);
    expect(store.data().goals[0]).toMatchObject({ saved: 1000, achievedMonth: '2026-10' });
  });
});

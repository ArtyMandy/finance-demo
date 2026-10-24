import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Clock } from '../core/clock';
import { FinanceStore } from '../data/finance-store';
import { Account } from '../data/models';
import { Overview } from './overview';

function account(partial: Partial<Account> & Pick<Account, 'id' | 'type'>): Account {
  return {
    name: partial.id,
    institution: '',
    openingBalance: 0,
    valuations: [],
    retirement: false,
    linkedLoanId: '',
    ...partial,
  };
}

const value = (amount: number) => [{ date: '2026-01-01', value: amount }];
const text = (element: Element | null | undefined) =>
  (element?.textContent ?? '').replace(/\s+/g, ' ');

describe('Overview: Vorsorgevermögen', () => {
  let store: FinanceStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(Clock).today.set('2026-10-18');
    store = TestBed.inject(FinanceStore);
    store.save('accounts', account({ id: 'giro', type: 'giro', valuations: value(2000) }));
  });

  const render = async () => {
    const fixture = TestBed.createComponent(Overview);
    await fixture.whenStable();
    return { fixture, hero: fixture.nativeElement.querySelector('.hero') as HTMLElement };
  };

  it('offers the toggle only once an account counts towards it', async () => {
    const { hero } = await render();
    expect(text(hero)).not.toContain('Vorsorgevermögen einrechnen');
  });

  it('leaves the Vorsorgevermögen out of the net worth when switched off', async () => {
    store.save(
      'accounts',
      account({ id: 'depot', type: 'depot', retirement: true, valuations: value(30000) }),
    );
    const { fixture, hero } = await render();
    expect(text(hero.querySelector('.big-number'))).toContain('32.000');
    expect(text(hero)).toContain('davon Vorsorge 30.000');

    const toggle = Array.from(hero.querySelectorAll('label')).find((label) =>
      text(label).includes('Vorsorgevermögen einrechnen'),
    )!;
    toggle.querySelector('input')!.click();
    await fixture.whenStable();

    expect(store.data().wealthOptions.includeRetirement).toBe(false);
    expect(text(hero.querySelector('.big-number'))).toContain('2.000');
    expect(text(hero)).toContain('Depots 0');
    expect(text(hero)).not.toContain('davon Vorsorge');
    expect(text(fixture.nativeElement)).toContain('ohne Vorsorgevermögen');
  });
});

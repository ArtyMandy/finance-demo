import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { Accounts } from '../accounts/accounts';
import { Clock } from '../core/clock';
import { FinanceStore } from '../data/finance-store';
import { Account } from '../data/models';
import { RULES } from '../rules/rules';

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

const text = (element: Element | null | undefined) =>
  (element?.textContent ?? '').replace(/\s+/g, ' ');

describe('Vorsorgevermögen', () => {
  let store: FinanceStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    TestBed.inject(Clock).today.set('2026-10-18');
    store = TestBed.inject(FinanceStore);
  });

  it('explains how to assign accounts while none counts', async () => {
    const harness = await RouterTestingHarness.create('/vorsorgevermoegen');
    const page = harness.routeNativeElement!;
    expect(text(page.querySelector('h1'))).toContain('Vorsorgevermögen');
    expect(text(page)).toContain('Noch keine Konten zugeordnet');
    expect(page.querySelector('app-retirement-projection')).toBeNull();
  });

  it('shows the marked accounts with the property net of its loan', async () => {
    const value = (amount: number) => [{ date: '2026-01-01', value: amount }];
    const accounts = [
      account({ id: 'Depot', type: 'depot', retirement: true, valuations: value(20000) }),
      // A Girokonto never counts, even when the flag is set.
      account({ id: 'Giro', type: 'giro', retirement: true, valuations: value(3000) }),
      account({ id: 'Kredit', type: 'kredit', valuations: value(90000) }),
      account({
        id: 'Wohnung',
        type: 'sachwert',
        retirement: true,
        linkedLoanId: 'Kredit',
        valuations: value(150000),
      }),
    ];
    accounts.forEach((entry) => store.save('accounts', entry));
    store.updateProfile({ ...store.data().profile, birthYear: 1990 });

    const harness = await RouterTestingHarness.create('/vorsorgevermoegen');
    const page = harness.routeNativeElement!;
    const items = Array.from(page.querySelectorAll('.list .list-title:first-child')).map((el) =>
      text(el).trim(),
    );
    expect(items).toEqual(['Depot', 'Wohnung']);
    expect(text(page.querySelector('.card-dark'))).toContain('80.000');
    expect(text(page)).toContain('noch 31 Jahre');
  });

  describe('Hochrechnung', () => {
    const depot = account({
      id: 'Depot',
      type: 'depot',
      retirement: true,
      valuations: [{ date: '2026-01-01', value: 10000 }],
    });

    it('asks for the birth year first', async () => {
      store.save('accounts', depot);
      const harness = await RouterTestingHarness.create('/vorsorgevermoegen');
      const projection = harness.routeNativeElement!.querySelector('app-retirement-projection');
      expect(text(projection)).toContain('Geburtsjahr');
      expect(projection?.querySelector('table')).toBeNull();
    });

    it('shows the value before and after tax and the return scenarios', async () => {
      store.save('accounts', depot);
      store.save('holdings', {
        id: 'etf',
        accountId: 'Depot',
        name: 'MSCI World',
        isin: '',
        assetType: 'etf',
        quantity: 100,
        buyPrice: 50,
        currentPrice: 100,
        savingsPlan: 0,
      });
      store.updateProfile({ ...store.data().profile, birthYear: 1959 });
      const harness = await RouterTestingHarness.create('/vorsorgevermoegen');
      const projection = harness.routeNativeElement!.querySelector('app-retirement-projection')!;

      // Retires this year: gain 5,000 € × 70 % − 1,000 € allowance, taxed at 26.375 %.
      expect(text(projection)).toContain('noch 0 Jahre');
      expect(text(projection)).toContain('−659 €');
      expect(text(projection)).toContain('9.341 €');
      expect(projection.querySelectorAll('tbody tr')).toHaveLength(4);
    });

    it('saves changed assumptions and restores the defaults', async () => {
      store.save('accounts', depot);
      store.updateProfile({ ...store.data().profile, birthYear: 1990 });
      const harness = await RouterTestingHarness.create('/vorsorgevermoegen');
      const projection = harness.routeNativeElement!.querySelector('app-retirement-projection')!;
      const input = projection.querySelector('form input') as HTMLInputElement;

      input.value = '7';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await harness.fixture.whenStable();
      expect(store.data().retirementAssumptions.depotReturn).toBeCloseTo(0.07);

      (projection.querySelector('form button') as HTMLButtonElement).click();
      await harness.fixture.whenStable();
      expect(store.data().retirementAssumptions).toEqual(RULES.vorsorge.defaultAssumptions);
      expect(input.value).toBe('5');
    });
  });
});

describe('Konto-Dialog', () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom has no modal dialogs.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
    };
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(Clock).today.set('2026-10-18');
  });

  it('saves the Vorsorge flag and the loan of a property', async () => {
    const store = TestBed.inject(FinanceStore);
    store.save('accounts', account({ id: 'kredit', name: 'Hauskredit', type: 'kredit' }));
    const fixture = TestBed.createComponent(Accounts);
    const page: HTMLElement = fixture.nativeElement;
    await fixture.whenStable();

    (page.querySelector('.page-head .btn') as HTMLButtonElement).click();
    await fixture.whenStable();
    const set = (selector: string, value: string) => {
      const field = page.querySelector(selector) as HTMLInputElement | HTMLSelectElement;
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    };
    set('dialog input[type="text"]', 'Wohnung');
    set('dialog select', 'sachwert');
    await fixture.whenStable();
    (page.querySelector('dialog input[type="checkbox"]') as HTMLInputElement).click();
    await fixture.whenStable();
    expect(text(page.querySelector('dialog'))).toContain('vermietete');
    set('dialog select[aria-describedby="loan-hint"]', 'kredit');
    (page.querySelector('dialog button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    const saved = store.data().accounts.find((a) => a.name === 'Wohnung');
    expect(saved).toMatchObject({ type: 'sachwert', retirement: true, linkedLoanId: 'kredit' });
  });

  it('does not offer the flag for a Girokonto', async () => {
    const fixture = TestBed.createComponent(Accounts);
    const page: HTMLElement = fixture.nativeElement;
    await fixture.whenStable();
    (page.querySelector('.page-head .btn') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(page.querySelector('dialog input[type="checkbox"]')).toBeNull();
  });
});

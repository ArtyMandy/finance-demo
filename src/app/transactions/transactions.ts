import {
  Component,
  computed,
  ElementRef,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, pattern, required, submit, validate } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
import { Clock } from '../core/clock';
import { isCash } from '../data/analytics';
import { CATEGORIES, categoryName } from '../data/categories';
import { FinanceStore } from '../data/finance-store';
import { DATE_PATTERN, monthOf } from '../data/months';
import { formatDateShort, formatEuro, formatMonth } from '../shared/format';
import { CsvImport } from './csv-import';

const PAGE_SIZE = 100;

@Component({
  imports: [CsvImport, FormField],
  selector: 'app-transactions',
  templateUrl: './transactions.html',
  styles: `
    .filters {
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
    }
    td select {
      min-width: 9rem;
      min-height: 2.25rem;
      padding: 0.25rem 0.5rem;
      border: 1px solid #64748b;
      border-radius: 8px;
      background: var(--color-surface);
      font: inherit;
    }
    .who {
      font-weight: 600;
    }
  `,
})
export class Transactions {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('bookingDialog');
  private readonly query = toSignal(inject(ActivatedRoute).queryParamMap);

  protected readonly categories = CATEGORIES;
  protected readonly category = categoryName;
  protected readonly eur = formatEuro;
  protected readonly date = formatDateShort;
  protected readonly cashAccounts = computed(() => this.store.data().accounts.filter(isCash));

  private readonly accountFromUrl = computed(() => this.query()?.get('konto') ?? '');
  /** Filters start with the account from the URL (?konto=…), e.g. coming from the accounts page. */
  protected readonly filter = linkedSignal(() => ({
    accountId: this.accountFromUrl(),
    month: '',
    categoryId: '',
    search: '',
  }));
  protected readonly filterForm = form(this.filter);
  protected readonly limit = signal(PAGE_SIZE);
  private readonly accountId = computed(() => this.filter().accountId);

  private readonly accountNames = computed(
    () => new Map(this.store.data().accounts.map((a) => [a.id, a.name])),
  );
  protected readonly accountName = (id: string) => this.accountNames().get(id) ?? '';

  protected readonly filtered = computed(() => {
    const { month, categoryId, search } = this.filter();
    const accountId = this.accountId();
    const needle = search.trim().toLowerCase();
    return this.store
      .data()
      .transactions.filter(
        (tx) =>
          (!accountId || tx.accountId === accountId) &&
          (!month || monthOf(tx.date) === month) &&
          (!categoryId || tx.categoryId === categoryId) &&
          (!needle || `${tx.counterparty} ${tx.purpose}`.toLowerCase().includes(needle)),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  });
  protected readonly visible = computed(() => this.filtered().slice(0, this.limit()));
  protected readonly sum = computed(() =>
    this.filtered().reduce((total, tx) => total + tx.amount, 0),
  );
  protected readonly filterLabel = computed(() => {
    const month = this.filter().month;
    return month ? formatMonth(month) : 'alle Monate';
  });

  protected readonly model = signal({
    accountId: '',
    date: '',
    amount: 0,
    direction: 'out',
    counterparty: '',
    purpose: '',
    categoryId: '',
  });
  protected readonly bookingForm = form(this.model, (s) => {
    required(s.accountId, { message: 'Bitte wähle ein Konto.' });
    required(s.date, { message: 'Bitte gib ein Datum ein.' });
    pattern(s.date, DATE_PATTERN, { message: 'Bitte ein gültiges Datum eingeben.' });
    validate(s.amount, ({ value }) =>
      value() > 0 ? undefined : { kind: 'positive', message: 'Der Betrag muss größer als 0 sein.' },
    );
    required(s.counterparty, { message: 'Bitte gib an, von wem oder an wen.' });
  });

  protected openBooking(): void {
    this.bookingForm().reset({
      accountId: this.accountId() || this.cashAccounts()[0]?.id || '',
      date: this.clock.today(),
      amount: 0,
      direction: 'out',
      counterparty: '',
      purpose: '',
      categoryId: '',
    });
    this.dialog().nativeElement.showModal();
  }

  protected saveBooking(): void {
    submit(this.bookingForm, async () => {
      const value = this.model();
      this.store.addTransaction({
        accountId: value.accountId,
        date: value.date,
        amount: value.direction === 'in' ? value.amount : -value.amount,
        counterparty: value.counterparty.trim(),
        purpose: value.purpose.trim(),
        categoryId: value.categoryId,
      });
      this.dialog().nativeElement.close();
    });
  }

  protected setCategory(id: string, event: Event): void {
    this.store.setCategory(id, (event.target as HTMLSelectElement).value);
  }

  protected remove(id: string): void {
    this.store.remove('transactions', id);
  }
}

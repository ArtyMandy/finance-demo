import {
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Clock } from '../core/clock';
import { categoryName } from '../data/categories';
import { FinanceStore } from '../data/finance-store';
import { duplicateSubscriptions, savingsPotentialPerMonth } from '../data/insights';
import { RecurringItem, RHYTHM_LABELS } from '../data/models';
import { addDays, daysBetween } from '../data/months';
import { fixedCostsPerMonth, isActiveIn, isCurrentOrFuture } from '../data/recurring';
import { RecurringForm } from '../income/recurring-form';
import { downloadText, slug } from '../shared/download';
import { RecurringSuggestions } from '../shared/recurring-suggestions';
import { formatDate, formatEuro, formatEuroRounded } from '../shared/format';
import { cancellationLetter, cancellationReminder } from './cancellation';

const SOON_DAYS = 60;

@Component({
  imports: [RecurringForm, RecurringSuggestions, RouterLink],
  selector: 'app-contracts',
  templateUrl: './contracts.html',
  styles: `
    .actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.375rem;
    }
    textarea {
      min-height: 22rem;
      font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
      font-size: 0.8125rem;
      line-height: 1.5;
    }
  `,
})
export class Contracts {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);
  private readonly document = inject(DOCUMENT);
  private readonly editor = viewChild.required(RecurringForm);
  private readonly letterDialog = viewChild.required<ElementRef<HTMLDialogElement>>('letterDialog');

  protected readonly eur = formatEuro;
  protected readonly eurRounded = formatEuroRounded;
  protected readonly date = formatDate;
  protected readonly rhythm = (item: RecurringItem) => RHYTHM_LABELS[item.rhythm];
  protected readonly soonDays = SOON_DAYS;
  protected readonly category = categoryName;

  private readonly current = computed(() =>
    this.store
      .data()
      .recurring.filter(
        (item) =>
          item.kind === 'expense' &&
          isCurrentOrFuture(item, this.clock.month()) &&
          item.rhythm !== 'once',
      ),
  );
  protected readonly contracts = computed(() =>
    [...this.current()].sort(
      (a, b) =>
        Number(a.status !== 'active') - Number(b.status !== 'active') || b.amount - a.amount,
    ),
  );

  protected readonly fixedCosts = computed(() =>
    fixedCostsPerMonth(this.store.data().recurring, this.clock.month()),
  );
  protected readonly potential = computed(
    () => savingsPotentialPerMonth(this.store.data(), this.clock.month()) * 12,
  );
  protected readonly duplicates = computed(() =>
    duplicateSubscriptions(this.store.data(), this.clock.month()).map((group) => ({
      ...group,
      names: group.items.map((item) => item.name).join(', '),
    })),
  );

  private readonly similar = computed(() => {
    const map = new Map<string, string>();
    for (const group of this.duplicates()) {
      for (const item of group.items) {
        map.set(
          item.id,
          `Ähnlich wie ${group.items
            .filter((other) => other !== item)
            .map((o) => o.name)
            .join(', ')}`,
        );
      }
    }
    return map;
  });

  protected readonly soon = computed(() => {
    const today = this.clock.today();
    const limit = addDays(today, SOON_DAYS);
    return this.contracts()
      .filter(
        (item) =>
          isActiveIn(item, this.clock.month()) &&
          (item.monthlyCancelable ||
            (item.cancelBy && item.cancelBy >= today && item.cancelBy <= limit)),
      )
      .map((item) => ({
        item,
        meta: item.cancelBy
          ? `Frist: ${formatDate(item.cancelBy)} (noch ${daysBetween(today, item.cancelBy)} Tage)`
          : 'monatlich kündbar',
        hint: this.similar().get(item.id) ?? '',
        urgent: !!item.cancelBy && daysBetween(today, item.cancelBy) <= 30,
      }))
      .sort(
        (a, b) =>
          Number(b.urgent) - Number(a.urgent) ||
          (a.item.cancelBy || '9').localeCompare(b.item.cancelBy || '9'),
      );
  });

  protected readonly letterItem = signal<RecurringItem | undefined>(undefined);
  protected readonly letter = computed(() => {
    const item = this.letterItem();
    return item ? cancellationLetter(item, this.store.data().profile, this.clock.today()) : '';
  });
  protected readonly profileIncomplete = computed(() => {
    const profile = this.store.data().profile;
    return !profile.name || !profile.street || !profile.city;
  });
  protected readonly copied = signal(false);

  protected add(): void {
    this.editor().open(undefined, 'expense');
  }

  protected edit(item: RecurringItem): void {
    this.editor().open(item);
  }

  protected openLetter(item: RecurringItem): void {
    this.letterItem.set(item);
    this.copied.set(false);
    this.letterDialog().nativeElement.showModal();
  }

  protected async copyLetter(): Promise<void> {
    await this.document.defaultView?.navigator.clipboard?.writeText(this.letter());
    this.copied.set(true);
  }

  protected downloadLetter(): void {
    const item = this.letterItem();
    if (item) downloadText(this.document, `kuendigung-${slug(item.name)}.txt`, this.letter());
  }

  protected downloadReminder(item: RecurringItem): void {
    downloadText(
      this.document,
      `vertragswecker-${slug(item.name)}.ics`,
      cancellationReminder(item, this.clock.today(), item.id),
      'text/calendar',
    );
  }

  protected setStatus(item: RecurringItem, status: RecurringItem['status']): void {
    const updated = { ...item, status };
    this.store.save(
      'recurring',
      status === 'cancelled' && !item.to ? { ...updated, to: this.clock.month() } : updated,
    );
    if (this.letterItem()?.id === item.id) this.letterDialog().nativeElement.close();
  }
}

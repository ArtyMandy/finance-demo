import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, min, pattern, required, submit } from '@angular/forms/signals';
import { Clock } from '../core/clock';
import { categoryName } from '../data/categories';
import { FinanceStore } from '../data/finance-store';
import { RecurringItem, RHYTHM_LABELS } from '../data/models';
import { MONTH_PATTERN } from '../data/months';
import { isActiveIn, monthlyEquivalent } from '../data/recurring';
import { formatEuro, formatMonth } from '../shared/format';
import { RecurringSuggestions } from '../shared/recurring-suggestions';
import { RecurringForm } from './recurring-form';

interface Series {
  current: RecurringItem;
  history: RecurringItem[];
  activeNow: boolean;
  ended: boolean;
}

/** Groups periods of the same income or expense; the newest period comes first. */
function toSeries(items: readonly RecurringItem[], month: string): Series[] {
  const groups = new Map<string, RecurringItem[]>();
  for (const item of items) groups.set(item.seriesId, [...(groups.get(item.seriesId) ?? []), item]);
  return [...groups.values()]
    .map((periods) => {
      const sorted = [...periods].sort((a, b) => b.from.localeCompare(a.from));
      const current = sorted.find((p) => isActiveIn(p, month)) ?? sorted[0];
      return {
        current,
        history: sorted.filter((p) => p !== current),
        activeNow: isActiveIn(current, month),
        ended: !!current.to && current.to < month,
      };
    })
    .sort((a, b) => Number(a.ended) - Number(b.ended) || b.current.amount - a.current.amount);
}

@Component({
  imports: [FormField, RecurringForm, RecurringSuggestions],
  selector: 'app-income',
  templateUrl: './income.html',
})
export class Income {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);
  private readonly editor = viewChild.required(RecurringForm);
  private readonly changeDialog = viewChild.required<ElementRef<HTMLDialogElement>>('changeDialog');

  private readonly items = computed(() => this.store.data().recurring);
  protected readonly incomes = computed(() =>
    toSeries(
      this.items().filter((i) => i.kind === 'income'),
      this.clock.month(),
    ),
  );
  protected readonly expenses = computed(() =>
    toSeries(
      this.items().filter((i) => i.kind === 'expense'),
      this.clock.month(),
    ),
  );

  protected readonly sections = computed(() => [
    {
      kind: 'income' as const,
      title: 'Einnahmen',
      list: this.incomes(),
      add: 'Einnahme hinzufügen',
    },
    {
      kind: 'expense' as const,
      title: 'Fixe Ausgaben',
      list: this.expenses(),
      add: 'Fixe Ausgabe hinzufügen',
    },
  ]);

  protected readonly incomePerMonth = computed(() => this.sumMonthly('income'));
  protected readonly expensesPerMonth = computed(() => this.sumMonthly('expense'));

  protected readonly eur = formatEuro;
  protected readonly month = formatMonth;
  protected readonly rhythm = (item: RecurringItem) => RHYTHM_LABELS[item.rhythm];
  protected readonly category = categoryName;

  protected readonly changing = signal<RecurringItem | undefined>(undefined);
  protected readonly changeModel = signal({ from: '', amount: 0 });
  protected readonly changeForm = form(this.changeModel, (s) => {
    required(s.from, { message: 'Bitte wähle einen Monat.' });
    pattern(s.from, MONTH_PATTERN, { message: 'Bitte im Format JJJJ-MM eingeben.' });
    required(s.amount, { message: 'Bitte gib einen Betrag ein.' });
    min(s.amount, 0.01, { message: 'Der Betrag muss größer als 0 sein.' });
  });

  private sumMonthly(kind: RecurringItem['kind']): number {
    return this.items()
      .filter((item) => item.kind === kind && isActiveIn(item, this.clock.month()))
      .reduce((sum, item) => sum + monthlyEquivalent(item), 0);
  }

  protected create(kind: RecurringItem['kind']): void {
    this.editor().open(undefined, kind);
  }

  protected edit(item: RecurringItem): void {
    this.editor().open(item);
  }

  protected openChange(item: RecurringItem): void {
    this.changing.set(item);
    const month = this.clock.month();
    this.changeForm().reset({ from: month > item.from ? month : item.from, amount: item.amount });
    this.changeDialog().nativeElement.showModal();
  }

  protected saveChange(): void {
    submit(this.changeForm, async () => {
      const item = this.changing();
      if (!item) return;
      this.store.changeAmountFrom(item, this.changeModel().from, this.changeModel().amount);
      this.changeDialog().nativeElement.close();
    });
  }

  protected endNow(item: RecurringItem): void {
    this.store.save('recurring', { ...item, to: this.clock.month() });
  }

  protected remove(series: Series): void {
    for (const item of [series.current, ...series.history]) this.store.remove('recurring', item.id);
  }
}

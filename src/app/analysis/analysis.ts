import { Component, computed, inject, linkedSignal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Clock } from '../core/clock';
import { monthTotals, spendingByCategory, CategoryAmount } from '../data/analytics';
import { FinanceStore } from '../data/finance-store';
import { addMonths, monthsBetween } from '../data/months';
import { CategoryBars } from '../shared/category-bars';
import { formatEuroRounded, formatMonth, formatMonthShort, formatPercent } from '../shared/format';
import { MonthBars } from '../shared/month-bars';

@Component({
  imports: [CategoryBars, FormField, MonthBars],
  selector: 'app-analysis',
  template: `
    <main id="inhalt" class="page">
      <div class="page-head">
        <div>
          <span class="eyebrow">Einnahmen und Ausgaben aus deinen Buchungen</span>
          <h1>Auswertung</h1>
        </div>
        <div class="form selectors">
          <label class="field">
            Jahr
            <select [formField]="selection.year">
              @for (year of years(); track year) {
                <option [value]="year">{{ year }}</option>
              }
            </select>
          </label>
          <label class="field">
            Monat
            <input type="month" placeholder="JJJJ-MM" [formField]="selection.month" />
          </label>
        </div>
      </div>

      <section class="card" aria-labelledby="year-heading">
        <h2 id="year-heading">Jahr {{ model().year }}</h2>
        <div class="grid-stats">
          <div class="stat">
            <span class="label">Einnahmen</span>
            <span class="stat-value">{{ eur(yearTotals().income) }}</span>
          </div>
          <div class="stat">
            <span class="label">Ausgaben</span>
            <span class="stat-value">{{ eur(yearTotals().expenses) }}</span>
          </div>
          <div class="stat">
            <span class="label">Gespart</span>
            <span
              class="stat-value"
              [class.positive]="yearTotals().saved >= 0"
              [class.negative]="yearTotals().saved < 0"
            >
              {{ eur(yearTotals().saved) }}
            </span>
          </div>
          <div class="stat">
            <span class="label">Sparquote</span>
            <span class="stat-value">{{ pct(yearTotals().rate) }}</span>
          </div>
        </div>
        <app-month-bars
          [bars]="bars()"
          [caption]="'Einnahmen und Ausgaben je Monat ' + model().year"
        />
      </section>

      <div class="grid">
        <section class="card" aria-labelledby="month-heading">
          <div class="spread">
            <h2 id="month-heading">{{ monthLabel() }}</h2>
            <span class="meta">Veränderung zum Vormonat</span>
          </div>
          <div class="grid-stats">
            <div class="stat">
              <span class="label">Einnahmen</span>
              <span class="stat-value">{{ eur(month().income) }}</span>
              <span class="meta">{{ delta(month().income, previous().income) }}</span>
            </div>
            <div class="stat">
              <span class="label">Ausgaben</span>
              <span class="stat-value">{{ eur(month().expenses) }}</span>
              <span class="meta">{{ delta(month().expenses, previous().expenses) }}</span>
            </div>
          </div>
          <app-category-bars [items]="monthCategories()" [previous]="previousCategories()" />
        </section>

        <section class="card" aria-labelledby="categories-year-heading">
          <h2 id="categories-year-heading">Ausgaben nach Kategorie {{ model().year }}</h2>
          <app-category-bars [items]="yearCategories()" />
        </section>
      </div>
    </main>
  `,
  styles: `
    .selectors {
      grid-template-columns: repeat(2, minmax(8rem, 10rem));
    }
  `,
})
export class Analysis {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);

  protected readonly eur = formatEuroRounded;
  protected readonly pct = formatPercent;

  protected readonly model = linkedSignal(() => ({
    year: String(this.clock.year()),
    month: this.clock.month(),
  }));
  protected readonly selection = form(this.model);

  protected readonly years = computed(() => {
    const years = new Set(this.store.data().transactions.map((tx) => tx.date.slice(0, 4)));
    years.add(String(this.clock.year()));
    return [...years].sort().reverse();
  });

  private readonly yearMonths = computed(() =>
    monthsBetween(`${this.model().year}-01`, `${this.model().year}-12`),
  );
  private readonly perMonth = computed(() =>
    this.yearMonths().map((month) => ({ month, ...monthTotals(this.store.data(), month) })),
  );

  protected readonly bars = computed(() =>
    this.perMonth().map((entry) => ({
      label: formatMonthShort(entry.month),
      longLabel: formatMonth(entry.month),
      income: entry.income,
      expenses: entry.expenses,
    })),
  );

  protected readonly yearTotals = computed(() => {
    const income = this.perMonth().reduce((sum, e) => sum + e.income, 0);
    const expenses = this.perMonth().reduce((sum, e) => sum + e.expenses, 0);
    return {
      income,
      expenses,
      saved: income - expenses,
      rate: income > 0 ? Math.max(0, income - expenses) / income : 0,
    };
  });

  protected readonly yearCategories = computed(() => {
    const totals = new Map<string, number>();
    for (const month of this.yearMonths()) {
      for (const entry of spendingByCategory(this.store.data(), month)) {
        totals.set(entry.categoryId, (totals.get(entry.categoryId) ?? 0) + entry.amount);
      }
    }
    return [...totals]
      .map(([categoryId, amount]): CategoryAmount => ({ categoryId, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  private readonly selectedMonth = computed(() => this.model().month || this.clock.month());
  protected readonly monthLabel = computed(() => formatMonth(this.selectedMonth()));
  protected readonly month = computed(() => monthTotals(this.store.data(), this.selectedMonth()));
  protected readonly previous = computed(() =>
    monthTotals(this.store.data(), addMonths(this.selectedMonth(), -1)),
  );
  protected readonly monthCategories = computed(() =>
    spendingByCategory(this.store.data(), this.selectedMonth()),
  );
  protected readonly previousCategories = computed(() =>
    spendingByCategory(this.store.data(), addMonths(this.selectedMonth(), -1)),
  );

  protected delta(current: number, before: number): string {
    if (!before) return 'Vormonat: keine Daten';
    const diff = current - before;
    const sign = diff > 0 ? '+' : diff < 0 ? '−' : '±';
    return `${sign}${formatEuroRounded(Math.abs(diff))} (${sign}${formatPercent(Math.abs(diff) / before)})`;
  }
}

import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Clock } from '../core/clock';
import {
  dueItems,
  monthTotals,
  spendingByCategory,
  wealthBreakdown,
  wealthHistory,
} from '../data/analytics';
import { createDemoData } from '../data/demo-data';
import { FinanceStore } from '../data/finance-store';
import { savingsHints } from '../data/insights';
import { daysBetween, lastDayOf, lastMonths } from '../data/months';
import { CategoryBars } from '../shared/category-bars';
import {
  formatEuroRounded,
  formatMonth,
  formatMonthShortYear,
  formatPercent,
  formatSignedPercent,
} from '../shared/format';
import { LineChart } from '../shared/line-chart';
import { Sparkline } from '../shared/sparkline';

const DUE_LIMIT = 6;

@Component({
  imports: [CategoryBars, LineChart, RouterLink, Sparkline],
  selector: 'app-overview',
  templateUrl: './overview.html',
  styles: `
    .hero {
      gap: 0.375rem;
    }
    .hero .split {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 1rem;
      font-size: 0.8125rem;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 1rem;
    }
    .legend i {
      display: inline-block;
      width: 0.625rem;
      height: 0.625rem;
      margin-right: 0.375rem;
      border-radius: 2px;
    }
    .sw-expenses {
      background: var(--color-text);
    }
    .onboarding ol {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin: 0;
      padding-left: 1.25rem;
    }
    .wide {
      grid-column: span 2;
    }
    @media (max-width: 40rem) {
      .wide {
        grid-column: auto;
      }
    }
  `,
})
export class Overview {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);

  protected readonly isEmpty = this.store.isEmpty;
  protected readonly monthLabel = computed(() => formatMonth(this.clock.month()));
  protected readonly daysLeft = computed(() =>
    daysBetween(this.clock.today(), lastDayOf(this.clock.month())),
  );

  private readonly months = computed(() => lastMonths(this.clock.month(), 12));
  private readonly history = computed(() =>
    wealthHistory(this.store.data(), this.months(), this.clock.month()),
  );

  protected readonly wealth = computed(() => wealthBreakdown(this.store.data()));
  protected readonly sparkline = computed(() => this.history());
  protected readonly historyPoints = computed(() =>
    this.months().map((month, index) => ({
      label: formatMonthShortYear(month),
      value: this.history()[index],
    })),
  );
  protected readonly change = computed(() => {
    const history = this.history();
    const before = history.at(-2) ?? 0;
    return before ? (history.at(-1)! - before) / Math.abs(before) : 0;
  });

  protected readonly totals = computed(() => monthTotals(this.store.data(), this.clock.month()));
  protected readonly leftover = computed(() => this.totals().income - this.totals().expenses);
  private readonly allDue = computed(() => dueItems(this.store.data(), this.clock.month()));
  protected readonly due = computed(() => this.allDue().slice(0, DUE_LIMIT));
  protected readonly moreDue = computed(() => this.allDue().length - this.due().length);
  protected readonly expenseShare = computed(() => {
    const { income, expenses } = this.totals();
    return Math.min(100, (expenses / Math.max(income, expenses, 1)) * 100);
  });
  protected readonly savingsRate = computed(() => {
    const income = this.totals().income;
    return income > 0 ? Math.max(0, this.leftover()) / income : 0;
  });

  protected readonly categories = computed(() =>
    spendingByCategory(this.store.data(), this.clock.month()),
  );
  protected readonly hints = computed(() =>
    savingsHints(this.store.data(), this.clock.month(), this.clock.today()).slice(0, 4),
  );

  protected readonly eur = formatEuroRounded;
  protected readonly pct = formatPercent;
  protected readonly signedPct = formatSignedPercent;

  protected loadDemo(): void {
    this.store.replace(createDemoData(this.clock.today()));
  }
}

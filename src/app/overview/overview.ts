import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Clock } from '../core/clock';
import {
  monthPreview,
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
    .sw-spent {
      background: var(--color-text);
    }
    .sw-planned {
      background: var(--chart-expense);
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

  protected readonly preview = computed(() => monthPreview(this.store.data(), this.clock.month()));
  protected readonly income = computed(
    () => this.preview().incomeActual + this.preview().incomePending,
  );
  protected readonly spentShare = computed(() => this.share(this.preview().expensesActual));
  protected readonly plannedShare = computed(() => this.share(this.preview().expensesPending));
  protected readonly savingsRate = computed(() => {
    const income = this.income();
    return income > 0 ? Math.max(0, this.preview().leftover) / income : 0;
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

  private share(value: number): number {
    const base = Math.max(
      this.income(),
      this.preview().expensesActual + this.preview().expensesPending,
      1,
    );
    return Math.min(100, (value / base) * 100);
  }

  protected loadDemo(): void {
    this.store.replace(createDemoData(this.clock.today()));
  }
}

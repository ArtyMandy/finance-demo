import { Component, computed, inject, resource, signal } from '@angular/core';
import { IncomeApi } from '../income/income-api';

const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const compactCurrency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const shortMonth = new Intl.DateTimeFormat('de-DE', { month: 'short', timeZone: 'UTC' });
const longMonth = new Intl.DateTimeFormat('de-DE', { month: 'long', timeZone: 'UTC' });

const NICE_FACTORS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** Rounds up to a "nice" axis maximum, e.g. 2800 → 3000, keeping the bars tall. */
export function niceCeil(value: number): number {
  if (value <= 0) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = NICE_FACTORS.find((factor) => value <= factor * magnitude) ?? 10;
  return step * magnitude;
}

@Component({
  selector: 'app-income-chart',
  template: `
    <figure class="chart">
      <figcaption>
        <h2>Monatliches Einkommen {{ year }}</h2>
        @if (incomes.hasValue()) {
          <p class="total">Summe {{ total() }}</p>
        }
      </figcaption>

      @if (incomes.error()) {
        <p class="error">Die Einträge konnten nicht geladen werden.</p>
      } @else if (incomes.hasValue()) {
        <div
          class="plot"
          role="img"
          [attr.aria-label]="'Balkendiagramm: Einkommen je Monat ' + year + ', Summe ' + total() + '. Werte in der Tabelle darunter.'"
          (mouseleave)="hovered.set(undefined)"
        >
          <div class="axis">
            @for (tick of ticks(); track tick.value) {
              <span class="tick" [style.bottom.%]="tick.percent">{{ tick.label }}</span>
            }
          </div>
          <div class="area">
            @for (tick of ticks(); track tick.value) {
              <span class="grid" [style.bottom.%]="tick.percent"></span>
            }
            @for (bar of bars(); track bar.month) {
              <div class="column" (mouseenter)="hovered.set(bar.month)">
                @if (hovered() === bar.month) {
                  <span class="tooltip" [style.bottom.%]="bar.percent">
                    <strong>{{ bar.longLabel }}</strong> {{ bar.amountLabel }}
                  </span>
                }
                <span
                  class="bar"
                  [class.active]="hovered() === bar.month"
                  [style.height.%]="bar.percent"
                ></span>
              </div>
            }
          </div>
          <div class="months">
            @for (bar of bars(); track bar.month) {
              <span>{{ bar.shortLabel }}</span>
            }
          </div>
        </div>

        <details>
          <summary>Als Tabelle anzeigen</summary>
          <table>
            <thead>
              <tr>
                <th scope="col">Monat</th>
                <th scope="col" class="amount">Betrag</th>
              </tr>
            </thead>
            <tbody>
              @for (bar of bars(); track bar.month) {
                <tr>
                  <th scope="row">{{ bar.longLabel }}</th>
                  <td class="amount">{{ bar.amountLabel }}</td>
                </tr>
              }
            </tbody>
          </table>
        </details>
      } @else {
        <p>Einträge werden geladen …</p>
      }
    </figure>
  `,
  styles: `
    .chart {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 0;
      padding: 1.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.75rem;
      background: #fff;
    }

    figcaption {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.5rem 1rem;
    }

    h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .total {
      margin: 0;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }

    .error {
      margin: 0;
      color: #b91c1c;
    }

    .plot {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-template-rows: 14rem auto;
      column-gap: 0.5rem;
      row-gap: 0.25rem;
    }

    .axis,
    .area {
      position: relative;
    }

    .axis {
      min-width: 3.5rem;
    }

    .tick {
      position: absolute;
      right: 0;
      transform: translateY(50%);
      color: #475569;
      font-size: 0.75rem;
      font-variant-numeric: tabular-nums;
    }

    .area {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      border-bottom: 1px solid #64748b;
    }

    .grid {
      position: absolute;
      inset-inline: 0;
      border-top: 1px solid #e2e8f0;
    }

    .column {
      position: relative;
      display: flex;
      flex: 1;
      align-items: flex-end;
      justify-content: center;
      height: 100%;
    }

    .bar {
      position: relative;
      width: min(100%, 2.5rem);
      border-radius: 4px 4px 0 0;
      background: var(--color-primary);
    }

    .bar.active {
      background: var(--color-primary-hover);
    }

    .tooltip {
      position: absolute;
      z-index: 1;
      margin-bottom: 0.375rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      background: var(--color-text);
      color: #fff;
      font-size: 0.8125rem;
      white-space: nowrap;
      pointer-events: none;
    }

    .months {
      display: flex;
      grid-column: 2;
      gap: 2px;
      color: #475569;
      font-size: 0.75rem;
    }

    .months span {
      flex: 1;
      text-align: center;
    }

    summary {
      color: var(--color-primary);
      font-weight: 600;
      cursor: pointer;
    }

    summary:focus-visible {
      outline: 3px solid var(--color-text);
      outline-offset: 3px;
    }

    table {
      width: 100%;
      margin-top: 0.5rem;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 0.375rem 0.5rem;
      border-bottom: 1px solid #cbd5e1;
      font-weight: 400;
      text-align: left;
    }

    thead th {
      font-weight: 700;
    }

    .amount {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    @media (max-width: 30rem) {
      .chart {
        padding: 1rem;
      }

      .months span:nth-child(even) {
        visibility: hidden;
      }
    }
  `,
})
export class IncomeChart {
  private readonly api = inject(IncomeApi);

  protected readonly year = new Date().getFullYear();
  protected readonly hovered = signal<number | undefined>(undefined);

  protected readonly incomes = resource({ loader: () => this.api.list() });

  /** Amount per month 1–12 of the current year; months without an entry are 0. */
  private readonly amounts = computed(() => {
    const amounts = Array<number>(12).fill(0);
    for (const income of this.incomes.hasValue() ? this.incomes.value() : []) {
      const [year, month] = income.month.split('-').map(Number);
      if (year === this.year) amounts[month - 1] = income.amount;
    }
    return amounts;
  });

  private readonly max = computed(() => niceCeil(Math.max(...this.amounts())));

  protected readonly total = computed(() =>
    currency.format(this.amounts().reduce((sum, amount) => sum + amount, 0)),
  );

  protected readonly ticks = computed(() =>
    [0, 0.5, 1].map((fraction) => ({
      value: fraction,
      percent: fraction * 100,
      label: compactCurrency.format(fraction * this.max()),
    })),
  );

  protected readonly bars = computed(() =>
    this.amounts().map((amount, index) => {
      const date = Date.UTC(this.year, index, 1);
      return {
        month: index + 1,
        percent: (amount / this.max()) * 100,
        shortLabel: shortMonth.format(date),
        longLabel: longMonth.format(date),
        amountLabel: currency.format(amount),
      };
    }),
  );
}

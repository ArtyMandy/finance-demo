import { Component, computed, input, signal } from '@angular/core';
import { formatEuroRounded } from './format';

export interface MonthBar {
  label: string;
  longLabel: string;
  income: number;
  expenses: number;
}

const NICE = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** Rounds up to a "nice" axis maximum, e.g. 2800 → 3000. */
export function niceCeil(value: number): number {
  if (value <= 0) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return (NICE.find((factor) => value <= factor * magnitude) ?? 10) * magnitude;
}

/** Income vs. expenses per month as paired bars, with legend, tooltip and table view. */
@Component({
  selector: 'app-month-bars',
  template: `
    <figure>
      <div class="legend meta" aria-hidden="true">
        <span><i class="swatch income"></i>Einnahmen</span>
        <span><i class="swatch expense"></i>Ausgaben</span>
      </div>
      <div
        class="plot"
        role="img"
        [attr.aria-label]="caption() + '. Werte in der Tabelle darunter.'"
        (mouseleave)="active.set(-1)"
      >
        <div class="axis meta">
          @for (tick of ticks(); track tick.value) {
            <span [style.bottom.%]="tick.percent">{{ tick.label }}</span>
          }
        </div>
        <div class="area">
          @for (tick of ticks(); track tick.value) {
            <span class="grid" [style.bottom.%]="tick.percent"></span>
          }
          @for (bar of scaled(); track bar.label; let i = $index) {
            <div class="column" (mouseenter)="active.set(i)">
              @if (active() === i) {
                <span class="tooltip">
                  <strong>{{ bar.longLabel }}</strong
                  ><br />
                  Einnahmen {{ bar.incomeText }}<br />
                  Ausgaben {{ bar.expensesText }}
                </span>
              }
              <span class="bar income" [style.height.%]="bar.incomePercent"></span>
              <span class="bar expense" [style.height.%]="bar.expensesPercent"></span>
            </div>
          }
        </div>
        <div class="labels meta">
          @for (bar of scaled(); track bar.label) {
            <span>{{ bar.label }}</span>
          }
        </div>
      </div>
      <details>
        <summary>Als Tabelle anzeigen</summary>
        <div class="table-wrap">
          <table>
            <caption class="visually-hidden">
              {{
                caption()
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">Monat</th>
                <th scope="col" class="amount">Einnahmen</th>
                <th scope="col" class="amount">Ausgaben</th>
                <th scope="col" class="amount">Saldo</th>
              </tr>
            </thead>
            <tbody>
              @for (bar of scaled(); track bar.label) {
                <tr>
                  <th scope="row">{{ bar.longLabel }}</th>
                  <td class="amount">{{ bar.incomeText }}</td>
                  <td class="amount">{{ bar.expensesText }}</td>
                  <td class="amount">{{ bar.balanceText }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  `,
  styleUrl: './month-bars.css',
})
export class MonthBars {
  readonly bars = input.required<readonly MonthBar[]>();
  readonly caption = input('Einnahmen und Ausgaben je Monat');

  protected readonly active = signal(-1);

  private readonly max = computed(() =>
    niceCeil(Math.max(0, ...this.bars().flatMap((bar) => [bar.income, bar.expenses]))),
  );

  protected readonly ticks = computed(() =>
    [0, 0.5, 1].map((share) => ({
      value: share,
      percent: share * 100,
      label: formatEuroRounded(share * this.max()),
    })),
  );

  protected readonly scaled = computed(() =>
    this.bars().map((bar) => ({
      ...bar,
      incomePercent: (bar.income / this.max()) * 100,
      expensesPercent: (bar.expenses / this.max()) * 100,
      incomeText: formatEuroRounded(bar.income),
      expensesText: formatEuroRounded(bar.expenses),
      balanceText: formatEuroRounded(bar.income - bar.expenses),
    })),
  );
}

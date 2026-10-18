import { Component, computed, input } from '@angular/core';
import { categoryName } from '../data/categories';
import { CategoryAmount } from '../data/analytics';
import { formatEuroRounded } from './format';

/** Spending per category as labelled horizontal bars (a list, so it reads well without the bars). */
@Component({
  selector: 'app-category-bars',
  template: `
    @if (rows().length) {
      <ul class="rows">
        @for (row of rows(); track row.categoryId) {
          <li>
            <span class="name">{{ row.name }}</span>
            <span class="bar bar-thin" aria-hidden="true"
              ><span [style.width.%]="row.percent"></span
            ></span>
            <span class="amount">{{ row.text }}</span>
            @if (row.delta !== undefined) {
              <span class="delta meta" [class.up]="row.delta > 0">{{ row.deltaText }}</span>
            }
          </li>
        }
      </ul>
    } @else {
      <p class="empty">Noch keine Ausgaben in diesem Zeitraum.</p>
    }
  `,
  styles: `
    .rows {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: grid;
      grid-template-columns: minmax(6rem, 9rem) minmax(3rem, 1fr) auto;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
    }
    li:has(.delta) {
      grid-template-columns: minmax(6rem, 9rem) minmax(3rem, 1fr) auto 4.5rem;
    }
    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .amount {
      font-weight: 500;
      text-align: right;
    }
    .delta {
      text-align: right;
    }
    .delta.up {
      color: var(--color-savings-text);
    }
  `,
})
export class CategoryBars {
  readonly items = input.required<readonly CategoryAmount[]>();
  /** Previous period, to show the change per category. */
  readonly previous = input<readonly CategoryAmount[] | undefined>(undefined);
  readonly limit = input(0);

  protected readonly rows = computed(() => {
    const items = this.limit() ? this.items().slice(0, this.limit()) : this.items();
    const max = Math.max(1, ...items.map((item) => item.amount));
    const previous = this.previous();
    return items.map((item) => {
      const before = previous?.find((entry) => entry.categoryId === item.categoryId)?.amount ?? 0;
      const delta = previous ? item.amount - before : undefined;
      return {
        categoryId: item.categoryId,
        name: categoryName(item.categoryId),
        text: formatEuroRounded(item.amount),
        percent: (item.amount / max) * 100,
        delta,
        deltaText:
          delta === undefined
            ? ''
            : `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${formatEuroRounded(Math.abs(delta))}`,
      };
    });
  });
}

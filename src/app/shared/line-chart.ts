import { Component, computed, input, signal } from '@angular/core';
import { formatEuroRounded } from './format';

export interface LinePoint {
  label: string;
  value: number;
}

/** Single-series line chart with hover/focus tooltip and a table view. */
@Component({
  selector: 'app-line-chart',
  template: `
    <figure>
      <div class="plot" role="img" [attr.aria-label]="summary()" (mouseleave)="active.set(-1)">
        <svg viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          @for (y of [50, 100, 150]; track y) {
            <line class="grid" x1="0" x2="600" [attr.y1]="y" [attr.y2]="y" />
          }
          <polyline [attr.points]="polyline()" />
          @if (activePoint(); as point) {
            <line class="cross" [attr.x1]="point.x" [attr.x2]="point.x" y1="0" y2="200" />
          }
        </svg>
        @if (activePoint(); as point) {
          <span class="dot" [style.left.%]="point.x / 6" [style.top.%]="point.y / 2"></span>
          <span class="tooltip" [style.left.%]="point.x / 6">
            <strong>{{ point.label }}</strong> {{ point.text }}
          </span>
        }
        <div class="hit">
          @for (point of coords(); track point.label; let i = $index) {
            <span (mouseenter)="active.set(i)"></span>
          }
        </div>
      </div>
      <div class="axis meta">
        @for (point of axisLabels(); track $index) {
          <span>{{ point }}</span>
        }
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
                <th scope="col">{{ labelHeading() }}</th>
                <th scope="col" class="amount">Wert</th>
              </tr>
            </thead>
            <tbody>
              @for (point of coords(); track point.label) {
                <tr>
                  <th scope="row">{{ point.label }}</th>
                  <td class="amount">{{ point.text }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  `,
  styles: `
    figure {
      margin: 0;
    }
    .plot {
      position: relative;
      height: 12.5rem;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    .grid {
      stroke: var(--color-border);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }
    .cross {
      stroke: var(--color-border-strong);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }
    polyline {
      fill: none;
      stroke: var(--chart-income);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }
    .hit {
      position: absolute;
      inset: 0;
      display: grid;
      grid-auto-columns: 1fr;
      grid-auto-flow: column;
    }
    .dot {
      position: absolute;
      width: 0.625rem;
      height: 0.625rem;
      border: 2px solid var(--color-surface);
      border-radius: 50%;
      background: var(--chart-income);
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .tooltip {
      position: absolute;
      top: 0;
      z-index: 1;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      background: var(--color-text);
      color: #fff;
      font-size: 0.8125rem;
      white-space: nowrap;
      transform: translateX(-50%);
      pointer-events: none;
    }
    .axis {
      display: flex;
      justify-content: space-between;
      margin-top: 0.25rem;
    }
  `,
})
export class LineChart {
  readonly points = input.required<readonly LinePoint[]>();
  readonly caption = input('Verlauf');
  /** Column heading of the labels in the table view. */
  readonly labelHeading = input('Monat');

  protected readonly active = signal(-1);

  private readonly range = computed(() => {
    const values = this.points().map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || Math.abs(max) * 0.1 || 1;
    return { min: min - padding, max: max + padding };
  });

  protected readonly coords = computed(() => {
    const points = this.points();
    const { min, max } = this.range();
    return points.map((point, index) => ({
      label: point.label,
      text: formatEuroRounded(point.value),
      x: points.length > 1 ? (index / (points.length - 1)) * 600 : 300,
      y: 200 - ((point.value - min) / (max - min)) * 200,
    }));
  });

  protected readonly polyline = computed(() =>
    this.coords()
      .map((point) => `${point.x},${point.y}`)
      .join(' '),
  );
  protected readonly activePoint = computed(() => this.coords()[this.active()]);

  protected readonly axisLabels = computed(() => {
    const points = this.points();
    if (points.length < 3) return points.map((point) => point.label);
    return [points[0].label, points[Math.floor(points.length / 2)].label, points.at(-1)!.label];
  });

  protected readonly summary = computed(() => {
    const points = this.points();
    if (!points.length) return this.caption();
    return `${this.caption()}: von ${formatEuroRounded(points[0].value)} (${points[0].label}) auf ${formatEuroRounded(points.at(-1)!.value)} (${points.at(-1)!.label}). Werte in der Tabelle darunter.`;
  });
}

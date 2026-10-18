import { Component, computed, input } from '@angular/core';

/** Small decorative trend line; the numbers it shows must be stated in text nearby. */
@Component({
  selector: 'app-sparkline',
  template: `
    <svg viewBox="0 0 300 48" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <polyline [attr.points]="points()" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }
    svg {
      display: block;
      width: 100%;
      height: 2.75rem;
      overflow: visible;
    }
    polyline {
      fill: none;
      stroke: var(--sparkline-color, var(--color-accent-dark));
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }
  `,
})
export class Sparkline {
  readonly values = input.required<readonly number[]>();

  protected readonly points = computed(() => {
    const values = this.values();
    if (values.length < 2) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values
      .map(
        (value, index) =>
          `${(index / (values.length - 1)) * 300},${44 - ((value - min) / range) * 40}`,
      )
      .join(' ');
  });
}

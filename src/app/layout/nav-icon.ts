import { Component, input } from '@angular/core';

/** Decorative 24×24 stroke icon. */
@Component({
  selector: 'app-nav-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      [attr.width]="size()"
      [attr.height]="size()"
    >
      @for (d of paths(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    svg {
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class NavIcon {
  readonly paths = input.required<readonly string[]>();
  readonly size = input(22);
}

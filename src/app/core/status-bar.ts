import { Component, inject } from '@angular/core';
import { AppUpdates } from './app-updates';
import { Connectivity } from './connectivity';

@Component({
  selector: 'app-status-bar',
  template: `
    <div role="status" aria-live="polite">
      @if (!connectivity.online()) {
        <p class="banner offline">
          Du bist offline. Einige Funktionen sind erst wieder verfügbar, wenn du online bist.
        </p>
      }
      @if (updates.updateReady()) {
        <p class="banner update">
          Eine neue Version von Finanz-demo ist verfügbar.
          <button type="button" (click)="updates.reload()">Neu laden</button>
        </p>
      }
    </div>
  `,
  styles: `
    :host {
      position: sticky;
      top: 0;
      z-index: 10;
      display: block;
    }

    .banner {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 0.75rem;
      margin: 0;
      padding: 0.75rem 1rem;
      text-align: center;
    }

    .offline {
      background: #fef3c7;
      color: var(--color-text);
    }

    .update {
      background: var(--color-primary);
      color: #fff;
    }

    button {
      padding: 0.375rem 1rem;
      border: none;
      border-radius: 0.5rem;
      background: #fff;
      color: var(--color-primary);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }

    button:focus-visible {
      outline: 3px solid #fff;
      outline-offset: 2px;
    }
  `,
})
export class StatusBar {
  protected readonly connectivity = inject(Connectivity);
  protected readonly updates = inject(AppUpdates);
}

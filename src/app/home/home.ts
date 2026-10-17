import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../core/auth';
import { IncomeChart } from './income-chart';

@Component({
  imports: [IncomeChart, RouterLink],
  selector: 'app-home',
  template: `
    <main class="content">
      <h1 class="visually-hidden">Übersicht</h1>
      @if (auth.user()) {
        <nav class="features" aria-labelledby="features-heading">
          <h2 id="features-heading">Funktionen</h2>
          <ul>
            <li><a routerLink="/einkommen">Einkommen erfassen</a></li>
          </ul>
        </nav>
        <app-income-chart class="chart" />
      } @else {
        <p class="hint">Melde dich an, um deine Funktionen und dein monatliches Einkommen zu sehen.</p>
      }
    </main>
  `,
  styles: `
    .content {
      display: grid;
      grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
      gap: 2rem;
      align-items: start;
      max-width: 72rem;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .features h2 {
      margin: 0 0 0.75rem;
      color: #475569;
      font-size: 0.875rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    ul {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li a {
      display: block;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
    }

    li a:hover {
      background: #f0fdfa;
    }

    li a:focus-visible {
      outline: 3px solid var(--color-text);
      outline-offset: 2px;
    }

    .hint {
      grid-column: 1 / -1;
      margin: 2rem 0;
      color: #475569;
      text-align: center;
    }

    @media (max-width: 48rem) {
      .content {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
})
export class Home {
  protected readonly auth = inject(Auth);
}

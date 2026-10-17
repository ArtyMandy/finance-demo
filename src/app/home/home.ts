import { NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../core/auth';

@Component({
  imports: [NgOptimizedImage, RouterLink],
  selector: 'app-home',
  template: `
    <header class="site-header">
      <a routerLink="/" class="brand">
        <img ngSrc="logo.svg" width="40" height="40" alt="" priority />
        <span>Finance-Demo</span>
      </a>
      <nav aria-label="Konto" class="account">
        @if (auth.user(); as user) {
          <span class="email">{{ user.email }}</span>
          <button type="button" class="button" [disabled]="busy()" (click)="signOut()">Abmelden</button>
        } @else {
          <a routerLink="/anmelden" class="button">Anmelden</a>
          <a routerLink="/anmelden" [queryParams]="{ modus: 'registrieren' }" class="button button-secondary">
            Registrieren
          </a>
        }
      </nav>
    </header>

    <main class="content">
      <h1>Finance-Demo</h1>
      <section class="features" aria-label="Funktionen">
        @if (auth.user()) {
          <a routerLink="/einkommen" class="feature">
            <h2>Einkommen erfassen</h2>
            <p>Monatliches Einkommen eintragen – auch für mehrere Monate auf einmal.</p>
          </a>
        }
      </section>
    </main>
  `,
  styles: `
    .site-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #cbd5e1;
      background: #fff;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: inherit;
      font-size: 1.25rem;
      font-weight: 700;
      text-decoration: none;
    }

    .account {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }

    .email {
      overflow-wrap: anywhere;
    }

    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
      max-width: 60rem;
      margin: 0 auto;
      padding: 3rem 1rem;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
      gap: 1rem;
      width: 100%;
      min-height: 12rem;
    }

    .feature {
      display: block;
      padding: 1.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.75rem;
      background: #fff;
      color: inherit;
      text-decoration: none;
    }

    .feature:hover {
      border-color: var(--color-primary);
    }

    .feature:focus-visible,
    .brand:focus-visible {
      outline: 3px solid var(--color-text);
      outline-offset: 3px;
    }

    .feature h2 {
      margin: 0 0 0.5rem;
      color: var(--color-primary);
      font-size: 1.25rem;
    }

    .feature p {
      margin: 0;
    }
  `,
})
export class Home {
  protected readonly auth = inject(Auth);
  protected readonly busy = signal(false);

  protected async signOut(): Promise<void> {
    this.busy.set(true);
    try {
      await this.auth.signOut();
    } finally {
      this.busy.set(false);
    }
  }
}

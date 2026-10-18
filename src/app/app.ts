import { Component, DOCUMENT, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';
import { StatusBar } from './core/status-bar';
import { FinanceSync } from './data/finance-sync';
import { MainNav } from './layout/main-nav';
import { SiteHeader } from './layout/site-header';

@Component({
  imports: [MainNav, RouterOutlet, SiteHeader, StatusBar],
  selector: 'app-root',
  template: `
    <a href="#inhalt" class="skip-link" (click)="focusMain(); $event.preventDefault()"
      >Zum Inhalt springen</a
    >
    <app-status-bar />
    <div class="shell">
      <app-main-nav class="sidebar" variant="sidebar" />
      <div class="content">
        <app-site-header />
        <router-outlet />
      </div>
    </div>
    <app-main-nav class="bottom-nav" variant="bottom" />
  `,
  styles: `
    .shell {
      display: flex;
      align-items: stretch;
      min-height: 100dvh;
    }

    .sidebar {
      flex: 0 0 15rem;
    }

    .content {
      flex: 1 1 auto;
      min-width: 0;
      padding-bottom: 5rem;
    }

    .skip-link {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      z-index: 100;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-control);
      background: var(--color-text);
      color: #fff;
      transform: translateY(-200%);
    }

    .skip-link:focus {
      transform: none;
    }

    @media (max-width: 47.99rem) {
      .sidebar {
        display: none;
      }
    }

    @media (min-width: 48rem) {
      .bottom-nav {
        display: none;
      }

      .content {
        padding-bottom: 0;
      }
    }
  `,
})
export class App {
  private readonly document = inject(DOCUMENT);

  constructor() {
    // Starts the cloud mirror; it stays idle until the user signs in.
    inject(FinanceSync);

    // Move focus to the new page after in-app navigation so screen readers announce it.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => setTimeout(() => this.focusMain()));
  }

  protected focusMain(): void {
    const main = this.document.getElementById('inhalt');
    if (!main) return;
    main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: false });
  }
}

import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AppInstall } from '../core/app-install';
import { Auth } from '../core/auth';
import { Connectivity } from '../core/connectivity';

@Component({
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive],
  selector: 'app-site-header',
  template: `
    <header class="site-header">
      <div class="start">
        <a routerLink="/" class="brand">
          <img ngSrc="logo.svg" width="40" height="40" alt="" priority />
          <span>Finance-Demo</span>
        </a>
        <nav aria-label="Hauptnavigation">
          <a
            routerLink="/"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link"
          >
            Übersicht
          </a>
        </nav>
      </div>
      <div class="end">
        @if (appInstall.canInstall()) {
          <button type="button" class="button button-secondary install" (click)="install()">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            App installieren
          </button>
        }
        <nav aria-label="Konto" class="account">
          @if (auth.user(); as user) {
            <span class="email">{{ user.email }}</span>
            <button
              type="button"
              class="button"
              [disabled]="busy() || offline()"
              (click)="signOut()"
            >
              Abmelden
            </button>
          } @else {
            <a routerLink="/anmelden" class="button">Anmelden</a>
            <a
              routerLink="/anmelden"
              [queryParams]="{ modus: 'registrieren' }"
              class="button button-secondary"
            >
              Registrieren
            </a>
          }
        </nav>
      </div>
    </header>
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

    .start,
    .end,
    .account {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem 1.5rem;
    }

    .end,
    .account {
      gap: 0.75rem;
    }

    .install {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
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

    .nav-link {
      padding: 0.25rem 0;
      border-bottom: 2px solid transparent;
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
    }

    .nav-link:hover,
    .nav-link.active {
      border-bottom-color: var(--color-primary);
    }

    .brand:focus-visible,
    .nav-link:focus-visible {
      outline: 3px solid var(--color-text);
      outline-offset: 3px;
    }

    .email {
      overflow-wrap: anywhere;
    }
  `,
})
export class SiteHeader {
  protected readonly auth = inject(Auth);
  protected readonly appInstall = inject(AppInstall);
  private readonly router = inject(Router);
  private readonly connectivity = inject(Connectivity);

  protected readonly offline = computed(() => !this.connectivity.online());
  protected readonly busy = signal(false);

  protected async install(): Promise<void> {
    await this.appInstall.install();
  }

  protected async signOut(): Promise<void> {
    this.busy.set(true);
    try {
      await this.auth.signOut();
      await this.router.navigateByUrl('/');
    } finally {
      this.busy.set(false);
    }
  }
}

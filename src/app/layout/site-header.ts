import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AppInstall } from '../core/app-install';
import { Auth } from '../core/auth';
import { Clock } from '../core/clock';
import { Connectivity } from '../core/connectivity';
import { FinanceStore } from '../data/finance-store';
import { FinanceSync } from '../data/finance-sync';
import { downloadBackup } from '../shared/download';
import { NavIcon } from './nav-icon';
import { PLAYGROUND_NAV, SECONDARY_NAV } from './nav-items';

const SYNC_LABELS = {
  off: '',
  syncing: 'Synchronisiere …',
  synced: 'In der Cloud gesichert',
  error: 'Sync fehlgeschlagen',
  unavailable: 'Nur auf diesem Gerät gespeichert',
} as const;

@Component({
  imports: [NavIcon, NgOptimizedImage, RouterLink, RouterLinkActive],
  selector: 'app-site-header',
  template: `
    <header class="site-header">
      <div class="start">
        <button
          type="button"
          class="btn btn-ghost btn-icon menu-button"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="mobile-menu"
          (click)="menuOpen.set(!menuOpen())"
        >
          <app-nav-icon [paths]="menuOpen() ? closeIcon : menuIcon" />
          <span class="visually-hidden">Weitere Bereiche</span>
        </button>
        <a routerLink="/" class="brand">
          <img ngSrc="logo.svg" width="32" height="32" alt="" priority />
          <span>Finanz-demo</span>
        </a>
      </div>
      <div class="end">
        @if (appInstall.canInstall()) {
          <button type="button" class="btn btn-secondary btn-small install" (click)="install()">
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
            @if (syncLabel(); as label) {
              <span class="sync meta" role="status">{{ label }}</span>
            }
            <a routerLink="/profil" class="email" [title]="user.email ?? ''">{{ user.email }}</a>
            <button
              type="button"
              class="btn btn-small"
              [disabled]="busy() || offline()"
              (click)="signOut()"
            >
              Abmelden
            </button>
          } @else {
            <a routerLink="/anmelden" class="btn btn-small">Anmelden</a>
            <a
              routerLink="/anmelden"
              [queryParams]="{ modus: 'registrieren' }"
              class="btn btn-secondary btn-small"
            >
              Registrieren
            </a>
          }
        </nav>
      </div>
    </header>
    @if (menuOpen()) {
      <nav id="mobile-menu" class="mobile-menu" aria-label="Weitere Bereiche">
        <ul>
          @for (item of menuItems; track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="active"
                ariaCurrentWhenActive="page"
                (click)="menuOpen.set(false)"
              >
                <app-nav-icon [paths]="item.icon" [size]="20" />
                {{ item.label }}
              </a>
            </li>
          }
        </ul>
      </nav>
    }

    <dialog #signOutDialog aria-labelledby="sign-out-title" aria-describedby="sign-out-text">
      <div class="dialog-body">
        <h2 id="sign-out-title">Daten sind nicht in der Cloud gesichert</h2>
        <p id="sign-out-text">
          Beim Abmelden werden deine Daten aus Datenschutzgründen von diesem Gerät gelöscht. Sie
          konnten gerade nicht in der Cloud gespeichert werden{{
            offline() ? ', weil du offline bist' : ''
          }}. Lade vorher eine Sicherung herunter, um sie später unter „Profil &amp; Daten“
          wiederherzustellen.
        </p>
        <div class="form-actions">
          <button type="button" class="btn" (click)="downloadBackup()">
            {{ backupSaved() ? 'Sicherung gespeichert ✓' : 'Sicherung herunterladen' }}
          </button>
          <button
            type="button"
            class="btn btn-danger"
            (click)="signOutDialog.close(); signOut(true)"
          >
            Trotzdem abmelden
          </button>
          <button type="button" class="btn btn-ghost" (click)="signOutDialog.close()">
            Abbrechen
          </button>
        </div>
      </div>
    </dialog>
  `,
  styleUrl: './site-header.css',
})
export class SiteHeader {
  protected readonly auth = inject(Auth);
  protected readonly appInstall = inject(AppInstall);
  private readonly router = inject(Router);
  private readonly connectivity = inject(Connectivity);
  private readonly sync = inject(FinanceSync);
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);
  private readonly document = inject(DOCUMENT);
  private readonly signOutDialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('signOutDialog');
  protected readonly backupSaved = signal(false);

  protected readonly menuItems = [...SECONDARY_NAV, ...PLAYGROUND_NAV];
  protected readonly menuIcon = ['M4 7h16', 'M4 12h16', 'M4 17h16'];
  protected readonly closeIcon = ['M6 6l12 12', 'M18 6L6 18'];

  protected readonly offline = computed(() => !this.connectivity.online());
  protected readonly busy = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly syncLabel = computed(() => SYNC_LABELS[this.sync.status()]);

  protected async install(): Promise<void> {
    await this.appInstall.install();
  }

  /**
   * Saves pending changes to the cloud, then signs out (which removes the data from this
   * device). If the data could not be saved, asks first so nothing is lost by accident.
   */
  protected async signOut(force = false): Promise<void> {
    this.busy.set(true);
    try {
      if (!force && !this.store.isEmpty() && !(await this.sync.flush())) {
        this.backupSaved.set(false);
        this.signOutDialog().nativeElement.showModal();
        return;
      }
      await this.sync.signOut();
      await this.router.navigateByUrl('/');
    } finally {
      this.busy.set(false);
    }
  }

  protected downloadBackup(): void {
    downloadBackup(this.document, this.store.data(), this.clock.today());
    this.backupSaved.set(true);
  }
}

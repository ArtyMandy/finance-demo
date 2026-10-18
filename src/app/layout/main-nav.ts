import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavIcon } from './nav-icon';
import { PRIMARY_NAV, SECONDARY_NAV } from './nav-items';

/** Sidebar from tablet width on, bottom tab bar on phones. */
@Component({
  imports: [NavIcon, NgOptimizedImage, RouterLink, RouterLinkActive],
  selector: 'app-main-nav',
  template: `
    @if (variant() === 'sidebar') {
      <aside class="sidebar">
        <a routerLink="/" class="brand">
          <img ngSrc="logo.svg" width="32" height="32" alt="" priority />
          <span>Finanz-demo</span>
        </a>
        <nav aria-label="Hauptnavigation">
          <ul>
            @for (item of primary; track item.path) {
              <li>
                <a
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  ariaCurrentWhenActive="page"
                  [routerLinkActiveOptions]="{ exact: item.path === '/' }"
                >
                  <app-nav-icon [paths]="item.icon" [size]="20" />
                  {{ item.label }}
                </a>
              </li>
            }
          </ul>
          <h2 id="more-heading">Weitere Bereiche</h2>
          <ul aria-labelledby="more-heading">
            @for (item of secondary; track item.path) {
              <li>
                <a [routerLink]="item.path" routerLinkActive="active" ariaCurrentWhenActive="page">
                  <app-nav-icon [paths]="item.icon" [size]="20" />
                  {{ item.label }}
                </a>
              </li>
            }
          </ul>
        </nav>
        <p class="note">Keine Bankverbindung nötig: Buchungen manuell oder per ING-CSV erfassen.</p>
      </aside>
    } @else {
      <nav aria-label="Hauptnavigation" class="tabs">
        @for (item of primary; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            [routerLinkActiveOptions]="{ exact: item.path === '/' }"
          >
            <app-nav-icon [paths]="item.icon" />
            {{ item.label }}
          </a>
        }
      </nav>
    }
  `,
  styleUrl: './main-nav.css',
})
export class MainNav {
  readonly variant = input<'sidebar' | 'bottom'>('sidebar');
  protected readonly primary = PRIMARY_NAV;
  protected readonly secondary = SECONDARY_NAV;
}

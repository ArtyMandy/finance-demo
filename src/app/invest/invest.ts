import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { accountBalance } from '../data/analytics';
import { FinanceStore } from '../data/finance-store';
import { RULES, sparerPauschbetrag } from '../rules/rules';
import { formatEuroRounded, formatSignedPercent } from '../shared/format';
import { Holdings } from './holdings';
import { SavingsPlanCalculator } from './savings-plan-calculator';

@Component({
  imports: [Holdings, RouterLink, SavingsPlanCalculator],
  selector: 'app-invest',
  template: `
    <main id="inhalt" class="page">
      <div class="page-head">
        <div>
          <span class="eyebrow">Depots · {{ depotCount() }} erfasst</span>
          <h1>Geldanlage</h1>
        </div>
        <div class="stat summary">
          <span class="stat-value">{{ eur(depotValue()) }}</span>
          @if (hasHoldings()) {
            <span class="meta" [class.positive]="gain() >= 0" [class.negative]="gain() < 0">
              {{ gain() >= 0 ? '+' : '' }}{{ eur(gain()) }} seit Kauf ({{ pct(gainPct()) }})
            </span>
          }
        </div>
      </div>

      <div class="grid">
        <app-savings-plan-calculator />

        <div class="stack">
          <a routerLink="/steuern" class="card">
            <div class="spread">
              <h2>Freistellungsaufträge</h2>
              <span class="savings-text"
                ><strong>{{ eur(exemptionFree()) }} frei</strong></span
              >
            </div>
            <div class="bar" aria-hidden="true">
              @for (order of exemptionBars(); track order.id) {
                <span [class.bar-dark]="$even" [style.width.%]="order.percent"></span>
              }
            </div>
            <span class="meta">{{ exemptionText() }}</span>
          </a>

          <a routerLink="/altersvorsorge" class="card card-tint card-link">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 10h16" />
              <path d="M5 10v9h14v-9" />
              <path d="M12 3l8 5H4z" />
              <path d="M9 14v3" />
              <path d="M15 14v3" />
            </svg>
            <span>
              <strong>Neu ab 2027: Altersvorsorgedepot</strong>
              <span class="meta"
                >Bis zu {{ maxGrant }} € Grundzulage im Jahr – Förderung berechnen</span
              >
            </span>
          </a>

          <a routerLink="/wissen" class="card card-link">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
              <path d="M4 21V5" />
            </svg>
            <span>
              <strong>Anlage-Wissen</strong>
              <span class="meta"
                >Tagesgeld, ETFs, Aktien, Anleihen, Immobilien, Krypto – Chancen, Risiken,
                Kosten</span
              >
            </span>
          </a>
        </div>
      </div>

      <app-holdings />

      <p class="disclaimer">
        Informationen und Berechnungen, keine Anlageberatung und keine Kaufempfehlung.
      </p>
    </main>
  `,
  styles: `
    .summary {
      align-items: flex-end;
    }
  `,
})
export class Invest {
  private readonly store = inject(FinanceStore);

  protected readonly eur = formatEuroRounded;
  protected readonly pct = formatSignedPercent;
  protected readonly maxGrant = RULES.altersvorsorgedepot.maxGrant;

  private readonly depots = computed(() =>
    this.store.data().accounts.filter((a) => a.type === 'depot'),
  );
  protected readonly depotCount = computed(() => this.depots().length);
  protected readonly depotValue = computed(() =>
    this.depots().reduce((sum, account) => sum + accountBalance(this.store.data(), account), 0),
  );
  protected readonly hasHoldings = computed(() => this.store.data().holdings.length > 0);
  private readonly cost = computed(() =>
    this.store.data().holdings.reduce((sum, h) => sum + h.quantity * h.buyPrice, 0),
  );
  protected readonly gain = computed(
    () =>
      this.store.data().holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0) -
      this.cost(),
  );
  protected readonly gainPct = computed(() => (this.cost() ? this.gain() / this.cost() : 0));

  private readonly pauschbetrag = computed(() =>
    sparerPauschbetrag(this.store.data().profile.jointAssessment),
  );
  private readonly orders = computed(() => this.store.data().exemptionOrders);
  protected readonly exemptionFree = computed(() =>
    Math.max(0, this.pauschbetrag() - this.orders().reduce((sum, order) => sum + order.amount, 0)),
  );
  protected readonly exemptionBars = computed(() =>
    this.orders().map((order) => ({
      id: order.id,
      percent: (order.amount / this.pauschbetrag()) * 100,
    })),
  );
  protected readonly exemptionText = computed(() =>
    [
      ...this.orders().map((o) => `${o.institution} ${formatEuroRounded(o.amount)}`),
      `Sparerpauschbetrag ${formatEuroRounded(this.pauschbetrag())}`,
    ].join(' · '),
  );
}

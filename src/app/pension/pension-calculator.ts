import { Component, computed, inject, linkedSignal } from '@angular/core';
import { form, FormField, max, min } from '@angular/forms/signals';
import { FinanceStore } from '../data/finance-store';
import { altersvorsorgeGrant, RULES } from '../rules/rules';
import { formatEuro, formatPercent } from '../shared/format';

/** Förderrechner for the Altersvorsorgedepot (from 2027). */
@Component({
  imports: [FormField],
  selector: 'app-pension-calculator',
  template: `
    <section class="card card-dark" aria-labelledby="avd-calc-heading">
      <h2 id="avd-calc-heading">Förderrechner Altersvorsorgedepot</h2>
      <div class="form">
        <label class="field">
          Eigenbeitrag pro Monat (€)
          <input type="number" inputmode="decimal" [formField]="calcForm.monthly" />
        </label>
        <label class="field">
          Kinder mit Kindergeld
          <input type="number" inputmode="numeric" [formField]="calcForm.children" />
        </label>
        <label class="field field-check">
          <input type="checkbox" [formField]="calcForm.starter" />
          Abschluss vor dem 25. Geburtstag
        </label>
      </div>
      <dl class="grid-stats" aria-live="polite">
        <div class="stat">
          <dt class="label">Eigenbeitrag / Jahr</dt>
          <dd class="stat-value">{{ eur(yearly()) }}</dd>
        </div>
        <div class="stat">
          <dt class="label">Grundzulage</dt>
          <dd class="stat-value">{{ eur(grant().basic) }}</dd>
        </div>
        <div class="stat">
          <dt class="label">Kinderzulage</dt>
          <dd class="stat-value">{{ eur(grant().children) }}</dd>
        </div>
        @if (grant().starterBonus) {
          <div class="stat">
            <dt class="label">Berufseinsteigerbonus (einmalig)</dt>
            <dd class="stat-value">{{ eur(grant().starterBonus) }}</dd>
          </div>
        }
        <div class="stat">
          <dt class="label">Zulagen gesamt</dt>
          <dd class="big-number positive">{{ eur(grant().total) }}</dd>
        </div>
      </dl>
      <p class="label" role="status">
        @if (!grant().eligible) {
          Unter dem Mindesteigenbeitrag von {{ eur(rules.minContribution) }} im Jahr gibt es keine
          Zulage.
        } @else {
          Förderquote {{ pct(quota()) }} auf deinen Eigenbeitrag.
          @if (yearly() > rules.stage2Limit) {
            Gefördert werden nur {{ eur(rules.stage2Limit) }}; der Rest bis
            {{ eur(rules.maxContribution) }} ist ungefördert möglich.
          }
          @if (yearly() > rules.maxContribution) {
            Mehr als {{ eur(rules.maxContribution) }} pro Jahr sind nicht möglich.
          }
        }
      </p>
      <p class="label">
        Formel: 50 % auf die ersten {{ eur(rules.stage1Limit) }} + 25 % auf
        {{ eur(rules.stage1Limit) }}–{{ eur(rules.stage2Limit) }}, je Kind 100 % bis
        {{ eur(rules.childLimit) }}. Zusätzlich prüft das Finanzamt, ob der Sonderausgabenabzug
        günstiger ist.
      </p>
    </section>
  `,
  styles: `
    dl,
    dd {
      margin: 0;
    }
  `,
})
export class PensionCalculator {
  private readonly store = inject(FinanceStore);

  protected readonly rules = RULES.altersvorsorgedepot;
  protected readonly eur = formatEuro;
  protected readonly pct = formatPercent;

  protected readonly model = linkedSignal(() => ({
    monthly: 150,
    children: this.store.data().profile.children,
    starter: false,
  }));
  protected readonly calcForm = form(this.model, (s) => {
    min(s.monthly, 0);
    min(s.children, 0);
    max(s.children, 20);
  });

  protected readonly yearly = computed(() => Math.max(0, this.model().monthly || 0) * 12);
  protected readonly grant = computed(() =>
    altersvorsorgeGrant(
      this.yearly(),
      Math.max(0, this.model().children || 0),
      this.model().starter,
    ),
  );
  protected readonly quota = computed(() =>
    this.yearly() ? (this.grant().basic + this.grant().children) / this.yearly() : 0,
  );
}

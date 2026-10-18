import { Component, computed, inject, linkedSignal } from '@angular/core';
import { form, FormField, min } from '@angular/forms/signals';
import { FinanceStore } from '../data/finance-store';
import { arbeitnehmerSparzulage, RULES, wohnungsbaupraemie } from '../rules/rules';
import { formatEuro } from '../shared/format';

/** Wohnungsbauprämie and Arbeitnehmersparzulage (VL) calculators. */
@Component({
  imports: [FormField],
  selector: 'app-subsidy-calculators',
  template: `
    <section class="card" aria-labelledby="wop-heading">
      <h2 id="wop-heading">Wohnungsbauprämie (Bausparen)</h2>
      <p class="meta">
        10 % Prämie auf eigene Einzahlungen bis {{ eur(wop.maxContribution.single) }} (Paare
        {{ eur(wop.maxContribution.joint) }}) im Jahr, wenn das zu versteuernde Einkommen höchstens
        {{ eur(wop.incomeLimit.single) }} ({{ eur(wop.incomeLimit.joint) }}) beträgt.
        Mindesteinzahlung {{ eur(wop.minContribution) }}, ab 16 Jahren.
      </p>
      <div class="form">
        <label class="field">
          Eigene Einzahlung im Jahr (€)
          <input type="number" inputmode="decimal" [formField]="wopForm.contribution" />
        </label>
        <label class="field">
          Zu versteuerndes Einkommen (€)
          <input type="number" inputmode="decimal" [formField]="wopForm.income" />
        </label>
        <label class="field field-check">
          <input type="checkbox" [formField]="wopForm.joint" />
          Verheiratet / eingetragene Partnerschaft
        </label>
      </div>
      <p aria-live="polite">
        Prämie: <strong class="stat-value">{{ eur(premium()) }}</strong> pro Jahr
        @if (!premium() && wopModel().contribution > 0) {
          <span class="meta">
            – Einkommensgrenze überschritten oder Mindesteinzahlung nicht erreicht.</span
          >
        }
      </p>
      <p class="meta">
        Ausgezahlt wird gesammelt bei Zuteilung; bei Verträgen ab 2009 nur für wohnwirtschaftliche
        Zwecke (Ausnahme: Abschluss vor dem 25. Geburtstag). VL zählen seit 2024 nicht mehr für die
        Prämie.
      </p>
    </section>

    <section class="card" aria-labelledby="vl-heading">
      <h2 id="vl-heading">VL-Sparen &amp; Arbeitnehmersparzulage</h2>
      <p class="meta">
        Der Staat legt auf vermögenswirksame Leistungen 20 % (Fondssparplan, bis
        {{ eur(vl.funds.maxContribution) }}) bzw. 9 % (Bausparen, bis
        {{ eur(vl.building.maxContribution) }}) drauf – bei einem zu versteuernden Einkommen bis
        {{ eur(vl.incomeLimit.single) }} ({{ eur(vl.incomeLimit.joint) }} zusammen). Sperrfrist
        {{ vl.lockYears }} Jahre.
      </p>
      <div class="form">
        <label class="field">
          VL in Fondssparplan pro Jahr (€)
          <input type="number" inputmode="decimal" [formField]="vlForm.funds" />
        </label>
        <label class="field">
          VL in Bausparvertrag pro Jahr (€)
          <input type="number" inputmode="decimal" [formField]="vlForm.building" />
        </label>
        <label class="field">
          Zu versteuerndes Einkommen (€)
          <input type="number" inputmode="decimal" [formField]="vlForm.income" />
        </label>
        <label class="field field-check">
          <input type="checkbox" [formField]="vlForm.joint" />
          Zusammenveranlagung
        </label>
      </div>
      <p aria-live="polite">
        Arbeitnehmersparzulage: <strong class="stat-value">{{ eur(grant()) }}</strong> pro Jahr
        <span class="meta">(höchstens {{ eur(maxGrant) }})</span>
      </p>
      <p class="meta">
        Beantragt wird mit der Steuererklärung (Anlage VL); gezahlt wird nach Ablauf der Sperrfrist.
      </p>
    </section>
  `,
})
export class SubsidyCalculators {
  private readonly store = inject(FinanceStore);

  protected readonly eur = formatEuro;
  protected readonly wop = RULES.wohnungsbaupraemie;
  protected readonly vl = RULES.vlSparen;
  protected readonly maxGrant =
    RULES.vlSparen.funds.maxContribution * RULES.vlSparen.funds.rate +
    RULES.vlSparen.building.maxContribution * RULES.vlSparen.building.rate;

  private readonly joint = computed(() => this.store.data().profile.jointAssessment);

  protected readonly wopModel = linkedSignal(() => ({
    contribution: 700,
    income: 30000,
    joint: this.joint(),
  }));
  protected readonly wopForm = form(this.wopModel, (s) => {
    min(s.contribution, 0);
    min(s.income, 0);
  });
  protected readonly premium = computed(() => {
    const m = this.wopModel();
    return wohnungsbaupraemie(m.contribution || 0, m.income || 0, m.joint);
  });

  protected readonly vlModel = linkedSignal(() => ({
    funds: 400,
    building: 0,
    income: 35000,
    joint: this.joint(),
  }));
  protected readonly vlForm = form(this.vlModel, (s) => {
    min(s.funds, 0);
    min(s.building, 0);
    min(s.income, 0);
  });
  protected readonly grant = computed(() => {
    const m = this.vlModel();
    return arbeitnehmerSparzulage(m.funds || 0, m.building || 0, m.income || 0, m.joint);
  });
}

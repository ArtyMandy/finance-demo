import { Component, computed, inject, linkedSignal } from '@angular/core';
import { form, FormField, min } from '@angular/forms/signals';
import { FinanceStore } from '../data/finance-store';
import {
  capitalGainsTax,
  ChurchTax,
  FundType,
  RULES,
  sparerPauschbetrag,
  vorabpauschale,
} from '../rules/rules';
import { formatEuro, formatPercentPrecise } from '../shared/format';

const FUND_TYPES: [FundType, string][] = [
  ['equity', 'Aktienfonds/-ETF (≥ 51 % Aktien) – 30 % steuerfrei'],
  ['mixed', 'Mischfonds (≥ 25 % Aktien) – 15 % steuerfrei'],
  ['other', 'Sonstige Erträge (Zinsen, Anleihen, Aktien) – 0 %'],
];

/** Kapitalertragsteuer and Vorabpauschale calculators (rules in RULES.kapitalertragsteuer). */
@Component({
  imports: [FormField],
  selector: 'app-capital-tax-calculator',
  template: `
    <section class="card" aria-labelledby="kest-heading">
      <h2 id="kest-heading">Kapitalertragsteuer-Rechner</h2>
      <p class="meta">
        Steuer fällt erst an, wenn die Kapitalerträge eines Jahres den Sparerpauschbetrag
        übersteigen. Satz: 25 % Abgeltungsteuer + Soli = {{ pct(baseRate) }}, mit Kirchensteuer
        etwas mehr.
      </p>
      <div class="form">
        <label class="field">
          Kapitalerträge im Jahr (€)
          <input type="number" inputmode="decimal" [formField]="kestForm.income" />
        </label>
        <label class="field">
          Art der Erträge
          <select [formField]="kestForm.fundType">
            @for (type of fundTypes; track type[0]) {
              <option [value]="type[0]">{{ type[1] }}</option>
            }
          </select>
        </label>
        <label class="field">
          Verfügbarer Freistellungsbetrag (€)
          <input type="number" inputmode="decimal" [formField]="kestForm.exemption" />
        </label>
        <label class="field">
          Kirchensteuer
          <select [formField]="kestForm.churchTax">
            <option value="0">keine</option>
            <option value="8">8 % (Bayern, Baden-Württemberg)</option>
            <option value="9">9 % (übrige Länder)</option>
          </select>
        </label>
      </div>
      <dl class="grid-stats" aria-live="polite">
        <div class="stat">
          <dt class="label">Steuerpflichtig nach Teilfreistellung</dt>
          <dd class="stat-value">{{ eur(kest().taxableIncome) }}</dd>
        </div>
        <div class="stat">
          <dt class="label">Durch Freistellung gedeckt</dt>
          <dd class="stat-value">{{ eur(kest().exemptionUsed) }}</dd>
        </div>
        <div class="stat">
          <dt class="label">Steuer ({{ pct(kest().rate) }})</dt>
          <dd class="stat-value">{{ eur(kest().tax) }}</dd>
        </div>
      </dl>
      <details>
        <summary>Gut zu wissen</summary>
        <ul class="hints">
          <li>
            Zeitpunkt: Zinsen und Dividenden bei Gutschrift, Kursgewinne beim Verkauf,
            Vorabpauschale Anfang Januar für das Vorjahr.
          </li>
          <li>
            Aktienverluste sind nur mit Aktiengewinnen verrechenbar, alle anderen Verluste im
            allgemeinen Verlusttopf.
          </li>
          <li>
            Günstigerprüfung: Liegt dein persönlicher Steuersatz unter 25 %, gibt es die Differenz
            über die Anlage KAP zurück.
          </li>
          <li>
            NV-Bescheinigung: Liegt dein Einkommen unter dem Grundfreibetrag ({{
              eur(grundfreibetrag)
            }}), zahlt die Bank auch über den Pauschbetrag hinaus ohne Abzug aus.
          </li>
          <li>
            Ausländische Broker führen keine Steuer ab – die Erträge gehören selbst in die Anlage
            KAP.
          </li>
          <li>Im Altersvorsorgedepot sind Erträge in der Ansparphase steuerfrei.</li>
        </ul>
      </details>
    </section>

    <section class="card" aria-labelledby="vorab-heading">
      <h2 id="vorab-heading">Vorabpauschale-Rechner {{ basisYear }}</h2>
      <p class="meta">
        Für thesaurierende Fonds: Fondswert zu Jahresbeginn × Basiszins {{ pct(basiszins) }} × 0,7,
        höchstens der tatsächliche Wertzuwachs, abzüglich Ausschüttungen. Wird beim späteren Verkauf
        angerechnet.
      </p>
      <div class="form">
        <label class="field">
          Fondswert 1. Januar (€)
          <input type="number" inputmode="decimal" [formField]="vorabForm.start" />
        </label>
        <label class="field">
          Fondswert 31. Dezember (€)
          <input type="number" inputmode="decimal" [formField]="vorabForm.end" />
        </label>
        <label class="field">
          Ausschüttungen im Jahr (€)
          <input type="number" inputmode="decimal" [formField]="vorabForm.distributions" />
        </label>
        <label class="field">
          Fondsart
          <select [formField]="vorabForm.fundType">
            @for (type of fundTypes; track type[0]) {
              <option [value]="type[0]">{{ type[1] }}</option>
            }
          </select>
        </label>
      </div>
      <dl class="grid-stats" aria-live="polite">
        <div class="stat">
          <dt class="label">Vorabpauschale</dt>
          <dd class="stat-value">{{ eur(vorab().amount) }}</dd>
        </div>
        <div class="stat">
          <dt class="label">Steuerpflichtig nach Teilfreistellung</dt>
          <dd class="stat-value">{{ eur(vorab().tax.taxableIncome) }}</dd>
        </div>
        <div class="stat">
          <dt class="label">Steuer ohne Freistellung</dt>
          <dd class="stat-value">{{ eur(vorab().tax.tax) }}</dd>
        </div>
      </dl>
    </section>
  `,
  styles: `
    dl,
    dd {
      margin: 0;
    }
    .hints {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.875rem;
    }
  `,
})
export class CapitalTaxCalculator {
  private readonly store = inject(FinanceStore);

  protected readonly fundTypes = FUND_TYPES;
  protected readonly eur = formatEuro;
  protected readonly pct = formatPercentPrecise;
  protected readonly baseRate = RULES.kapitalertragsteuer.rate.none;
  protected readonly basiszins = RULES.kapitalertragsteuer.basiszins;
  protected readonly basisYear = RULES.kapitalertragsteuer.basiszinsYear;
  protected readonly grundfreibetrag = RULES.kapitalertragsteuer.grundfreibetrag;

  private readonly free = computed(() => {
    const data = this.store.data();
    const given = data.exemptionOrders.reduce((sum, o) => sum + o.amount, 0);
    return given > 0 ? given : sparerPauschbetrag(data.profile.jointAssessment);
  });

  protected readonly kestModel = linkedSignal(() => ({
    income: 1500,
    fundType: 'equity' as string,
    exemption: this.free(),
    churchTax: String(this.store.data().profile.churchTax),
  }));
  protected readonly kestForm = form(this.kestModel, (s) => {
    min(s.income, 0);
    min(s.exemption, 0);
  });
  protected readonly kest = computed(() => {
    const m = this.kestModel();
    return capitalGainsTax(m.income || 0, {
      fundType: m.fundType as FundType,
      exemption: m.exemption || 0,
      churchTax: Number(m.churchTax) as ChurchTax,
    });
  });

  protected readonly vorabModel = linkedSignal(() => ({
    start: 10000,
    end: 10800,
    distributions: 0,
    fundType: 'equity' as string,
    churchTax: this.store.data().profile.churchTax,
  }));
  protected readonly vorabForm = form(this.vorabModel, (s) => {
    min(s.start, 0);
    min(s.end, 0);
    min(s.distributions, 0);
  });
  protected readonly vorab = computed(() => {
    const m = this.vorabModel();
    const amount = vorabpauschale(m.start || 0, m.end || 0, m.distributions || 0);
    return {
      amount,
      tax: capitalGainsTax(amount, {
        fundType: m.fundType as FundType,
        exemption: 0,
        churchTax: m.churchTax,
      }),
    };
  });
}

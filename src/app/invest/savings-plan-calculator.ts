import { Component, computed, signal } from '@angular/core';
import { form, FormField, max, min } from '@angular/forms/signals';
import { savingsPlanValue } from '../rules/rules';
import { formatEuroRounded } from '../shared/format';

const RATES = [100, 250, 500];
const YEARS = [10, 20, 30];
const SCENARIOS = [0.02, 0.04, 0.06, 0.08];

/** What becomes of X € per month in Y years (compound interest, several return scenarios). */
@Component({
  imports: [FormField],
  selector: 'app-savings-plan-calculator',
  template: `
    <section class="card card-dark" aria-labelledby="calc-heading">
      <h2 id="calc-heading">Sparplan-Rechner</h2>
      <fieldset class="stack">
        <legend class="label">Monatliche Rate</legend>
        <div class="choice-group">
          @for (rate of rates; track rate) {
            <button
              type="button"
              [attr.aria-pressed]="model().rate === rate"
              (click)="set('rate', rate)"
            >
              {{ rate }} €
            </button>
          }
        </div>
      </fieldset>
      <fieldset class="stack">
        <legend class="label">Laufzeit</legend>
        <div class="choice-group">
          @for (years of yearOptions; track years) {
            <button
              type="button"
              [attr.aria-pressed]="model().years === years"
              (click)="set('years', years)"
            >
              {{ years }} Jahre
            </button>
          }
        </div>
      </fieldset>
      <details>
        <summary class="custom">Eigene Werte</summary>
        <div class="form">
          <label class="field">
            Rate pro Monat (€)
            <input type="number" inputmode="decimal" [formField]="calcForm.rate" />
          </label>
          <label class="field">
            Laufzeit (Jahre)
            <input type="number" inputmode="numeric" [formField]="calcForm.years" />
          </label>
          <label class="field">
            Startkapital (€)
            <input type="number" inputmode="decimal" [formField]="calcForm.start" />
          </label>
          <label class="field">
            Rendite p. a. (%)
            <input
              type="number"
              inputmode="decimal"
              step="0.5"
              [formField]="calcForm.returnPercent"
            />
          </label>
        </div>
      </details>
      <div class="result" aria-live="polite">
        <div class="stat">
          <span class="label">Mögliches Endvermögen</span>
          <span class="big-number positive">{{ eur(result()) }}</span>
        </div>
        <span class="label right"
          >eingezahlt {{ eur(paid()) }}<br />Annahme {{ model().returnPercent }} % p. a.</span
        >
      </div>
      <table class="scenarios">
        <caption class="label">
          Szenarien bei gleicher Rate und Laufzeit
        </caption>
        <thead>
          <tr>
            @for (scenario of scenarios(); track scenario.rate) {
              <th scope="col" class="amount">{{ scenario.label }}</th>
            }
          </tr>
        </thead>
        <tbody>
          <tr>
            @for (scenario of scenarios(); track scenario.rate) {
              <td class="amount">{{ scenario.value }}</td>
            }
          </tr>
        </tbody>
      </table>
      <p class="label">Rechenbeispiel ohne Kosten und Steuern; Renditen sind nicht garantiert.</p>
    </section>
  `,
  styles: `
    .result {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-end;
      gap: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--color-dark-line);
    }
    .right {
      text-align: right;
    }
    .custom {
      color: var(--color-accent-dark);
    }
    .scenarios th,
    .scenarios td {
      border-color: var(--color-dark-line);
      color: #f8fafc;
    }
    .scenarios caption {
      padding-bottom: 0.25rem;
      text-align: left;
    }
  `,
})
export class SavingsPlanCalculator {
  protected readonly rates = RATES;
  protected readonly yearOptions = YEARS;
  protected readonly eur = formatEuroRounded;

  protected readonly model = signal({ rate: 250, years: 20, start: 0, returnPercent: 6 });
  protected readonly calcForm = form(this.model, (s) => {
    min(s.rate, 0);
    min(s.years, 1);
    max(s.years, 60);
    min(s.start, 0);
    min(s.returnPercent, -10);
    max(s.returnPercent, 20);
  });

  private readonly safe = computed(() => {
    const { rate, years, start, returnPercent } = this.model();
    return {
      rate: Math.max(0, rate || 0),
      years: Math.min(60, Math.max(0, years || 0)),
      start: Math.max(0, start || 0),
      yearly: (returnPercent || 0) / 100,
    };
  });

  protected readonly result = computed(() => {
    const { rate, years, start, yearly } = this.safe();
    return savingsPlanValue(rate, years, yearly, start);
  });
  protected readonly paid = computed(
    () => this.safe().rate * this.safe().years * 12 + this.safe().start,
  );
  protected readonly scenarios = computed(() => {
    const { rate, years, start } = this.safe();
    return SCENARIOS.map((yearly) => ({
      rate: yearly,
      label: `${yearly * 100} %`,
      value: formatEuroRounded(savingsPlanValue(rate, years, yearly, start)),
    }));
  });

  protected set(key: 'rate' | 'years', value: number): void {
    this.model.update((model) => ({ ...model, [key]: value }));
  }
}

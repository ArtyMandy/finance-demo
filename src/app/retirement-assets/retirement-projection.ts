import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { form, FormField, max, min } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Clock } from '../core/clock';
import { FinanceStore } from '../data/finance-store';
import { RetirementAssumptions } from '../data/models';
import {
  ProjectionOptions,
  projectRetirement,
  RetirementPosition,
  returnScenarios,
  yearsUntilRetirement,
} from '../data/retirement';
import { RULES } from '../rules/rules';
import { formatEuroRounded, formatPercent, formatPercentPrecise } from '../shared/format';
import { LineChart, LinePoint } from '../shared/line-chart';

type AssumptionKey = keyof RetirementAssumptions;

/** Form fields in percent; the store keeps rates (5 % = 0.05). */
const FIELDS: readonly { key: AssumptionKey; label: string; hint: string }[] = [
  { key: 'depotReturn', label: 'Rendite Depots p. a. (%)', hint: 'Vor Steuern und nach Kosten.' },
  { key: 'cashReturn', label: 'Zins Tagesgeld p. a. (%)', hint: 'Nach Steuern.' },
  { key: 'realEstateGrowth', label: 'Wertsteigerung Immobilien p. a. (%)', hint: '' },
  {
    key: 'contributionGrowth',
    label: 'Erhöhung der Sparraten p. a. (%)',
    hint: 'Dynamik, einmal pro Jahr.',
  },
  { key: 'inflation', label: 'Inflation p. a. (%)', hint: 'Für die heutige Kaufkraft.' },
];

/** Applies a conversion to every assumption, e.g. rate → percent. */
function mapAssumptions(
  a: RetirementAssumptions,
  convert: (value: number) => number,
): RetirementAssumptions {
  return {
    depotReturn: convert(a.depotReturn),
    cashReturn: convert(a.cashReturn),
    realEstateGrowth: convert(a.realEstateGrowth),
    contributionGrowth: convert(a.contributionGrowth),
    inflation: convert(a.inflation),
  };
}

const toPercent = (a: RetirementAssumptions) =>
  mapAssumptions(a, (rate) => Math.round(rate * 10000) / 100);
const toRate = (a: RetirementAssumptions) =>
  mapAssumptions(a, (percent) => (Number(percent) || 0) / 100);

/** Projection of the Vorsorgevermögen until retirement, with Kapitalertragsteuer. */
@Component({
  imports: [FormField, LineChart, RouterLink],
  selector: 'app-retirement-projection',
  templateUrl: './retirement-projection.html',
  styles: `
    dl,
    dd {
      margin: 0;
    }
    .breakdown {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.25rem 1rem;
      font-size: 0.875rem;
    }
    .breakdown dd {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .breakdown .sum {
      font-weight: 600;
    }
    .facts {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.875rem;
    }
    tr.current th,
    tr.current td {
      font-weight: 600;
    }
  `,
})
export class RetirementProjection {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);

  /** Positions from the parent's retirementStatus. */
  readonly positions = input.required<readonly RetirementPosition[]>();

  protected readonly eur = formatEuroRounded;
  protected readonly pct = formatPercent;
  protected readonly pctPrecise = formatPercentPrecise;
  protected readonly fields = FIELDS;
  protected readonly speculationYears = RULES.vorsorge.realEstateSpeculationYears;

  private readonly year = computed(() => Number(this.clock.today().slice(0, 4)));
  protected readonly profile = computed(() => this.store.data().profile);
  protected readonly years = computed(() => yearsUntilRetirement(this.profile(), this.year()));
  protected readonly retirementYear = computed(() => this.year() + (this.years() ?? 0));

  protected readonly model = linkedSignal(() =>
    toPercent(this.store.data().retirementAssumptions),
  );
  protected readonly assumptionsForm = form(this.model, (s) => {
    for (const { key } of FIELDS) {
      min(s[key], -10, { message: 'Bitte mindestens −10 % eingeben.' });
      max(s[key], 20, { message: 'Bitte höchstens 20 % eingeben.' });
    }
  });

  /** Assumptions as rates, from the form while it is valid. */
  private readonly assumptions = computed<RetirementAssumptions>(() => {
    const saved = this.store.data().retirementAssumptions;
    if (this.assumptionsForm().invalid()) return saved;
    return toRate(this.model());
  });

  private readonly options = computed<ProjectionOptions>(() => ({
    years: this.years() ?? 0,
    assumptions: this.assumptions(),
    jointAssessment: this.profile().jointAssessment,
    churchTax: this.profile().churchTax,
  }));

  protected readonly projection = computed(() =>
    projectRetirement(this.positions(), this.options()),
  );
  protected readonly scenarios = computed(() =>
    returnScenarios(this.positions(), this.options()).map((scenario) => ({
      ...scenario,
      current: Math.abs(scenario.depotReturn - this.assumptions().depotReturn) < 1e-9,
    })),
  );

  protected readonly depotReturn = computed(() => this.assumptions().depotReturn);

  /** Show values in today's money. */
  protected readonly real = signal(false);
  protected readonly chartCaption = computed(() =>
    this.real() ? 'Vorsorgevermögen in heutiger Kaufkraft' : 'Vorsorgevermögen vor Steuern',
  );
  protected readonly chartPoints = computed<LinePoint[]>(() => {
    const inflation = this.assumptions().inflation;
    return this.projection().points.map((point) => ({
      label: String(this.year() + point.offset),
      value: this.real() ? point.total / (1 + inflation) ** point.offset : point.total,
    }));
  });

  protected readonly hasDepot = computed(() => this.positions().some((p) => p.kind === 'depot'));
  protected readonly hasRealEstate = computed(() =>
    this.positions().some((p) => p.kind === 'realEstate'),
  );
  protected readonly hasLoan = computed(() => this.positions().some((p) => p.loan > 0));

  /** Saves the assumptions as soon as the form is valid. */
  protected save(): void {
    if (this.assumptionsForm().invalid()) return;
    this.store.setRetirementAssumptions(this.assumptions());
  }

  protected resetAssumptions(): void {
    this.store.setRetirementAssumptions({ ...RULES.vorsorge.defaultAssumptions });
  }
}

/**
 * Funding and tax rules (as of 18.10.2026, see docs/regeln-foerderung-steuern.md).
 * All yearly values live here so they can be updated in one place. No tax or investment advice.
 */
export const RULES = {
  asOf: '2026-10-18',

  altersvorsorgedepot: {
    startDate: '2027-01-01',
    minContribution: 120,
    stage1Limit: 360,
    stage1Rate: 0.5,
    stage2Limit: 1800,
    stage2Rate: 0.25,
    maxGrant: 540,
    childLimit: 300,
    childRate: 1,
    starterBonus: 200,
    starterBonusMaxAge: 25,
    maxContribution: 6840,
    maxContracts: 2,
    standardDepotMaxCost: 0.01,
    payoutEarliestAge: 65,
    payoutLatestAge: 70,
  },

  /** Planned; only switch on once the law is promulgated. */
  fruehstartRente: {
    active: false,
    monthlyAmount: 10,
    ageFrom: 6,
    ageTo: 18,
  },

  kapitalertragsteuer: {
    sparerPauschbetrag: { single: 1000, joint: 2000 },
    rate: { none: 0.26375, church8: 0.2782, church9: 0.2799 },
    teilfreistellung: { equity: 0.3, mixed: 0.15, other: 0 },
    basiszins: 0.0229,
    basiszinsYear: 2026,
    vorabpauschaleFactor: 0.7,
    grundfreibetrag: 12348,
  },

  wohnungsbaupraemie: {
    rate: 0.1,
    maxContribution: { single: 700, joint: 1400 },
    incomeLimit: { single: 35000, joint: 70000 },
    minContribution: 50,
    minAge: 16,
  },

  vlSparen: {
    funds: { rate: 0.2, maxContribution: 400 },
    building: { rate: 0.09, maxContribution: 470 },
    incomeLimit: { single: 40000, joint: 80000 },
    lockYears: 7,
  },

  emergencyFund: { minMonths: 3, maxMonths: 6 },

  /** Vorsorgevermögen projection: assumptions only, no forecast or advice. */
  vorsorge: {
    defaultRetirementAge: 67,
    returnScenarios: [0.02, 0.04, 0.06, 0.08],
    defaultAssumptions: {
      depotReturn: 0.05,
      cashReturn: 0.015,
      realEstateGrowth: 0,
      contributionGrowth: 0,
      inflation: 0.02,
    },
    /** Private sale of a property is tax-free after this holding period (§ 23 EStG). */
    realEstateSpeculationYears: 10,
  },
} as const;

export type ChurchTax = 0 | 8 | 9;
export type FundType = 'equity' | 'mixed' | 'other';

const round2 = (value: number) => Math.round(value * 100) / 100;

export interface PensionGrant {
  basic: number;
  children: number;
  starterBonus: number;
  total: number;
  eligible: boolean;
  fundedContribution: number;
}

/** Yearly Altersvorsorgedepot grant for an own contribution, children count and starter bonus. */
export function altersvorsorgeGrant(
  contribution: number,
  children = 0,
  starterBonus = false,
): PensionGrant {
  const r = RULES.altersvorsorgedepot;
  const eligible = contribution >= r.minContribution;
  const capped = Math.min(Math.max(contribution, 0), r.maxContribution);
  const basic = eligible
    ? Math.min(capped, r.stage1Limit) * r.stage1Rate +
      Math.max(0, Math.min(capped, r.stage2Limit) - r.stage1Limit) * r.stage2Rate
    : 0;
  const perChild = eligible ? Math.min(capped, r.childLimit) * r.childRate : 0;
  const childGrant = perChild * Math.max(0, Math.floor(children));
  const bonus = eligible && starterBonus ? r.starterBonus : 0;
  return {
    basic: round2(basic),
    children: round2(childGrant),
    starterBonus: bonus,
    total: round2(basic + childGrant + bonus),
    eligible,
    fundedContribution: Math.min(capped, r.stage2Limit),
  };
}

export function sparerPauschbetrag(joint: boolean): number {
  const p = RULES.kapitalertragsteuer.sparerPauschbetrag;
  return joint ? p.joint : p.single;
}

export function capitalGainsTaxRate(churchTax: ChurchTax): number {
  const r = RULES.kapitalertragsteuer.rate;
  return churchTax === 8 ? r.church8 : churchTax === 9 ? r.church9 : r.none;
}

export interface CapitalGainsTax {
  taxableIncome: number;
  exemptionUsed: number;
  taxBase: number;
  tax: number;
  rate: number;
}

/** steuer = max(0, erträge_nach_teilfreistellung − freistellung) × satz */
export function capitalGainsTax(
  income: number,
  options: { fundType?: FundType; exemption: number; churchTax: ChurchTax },
): CapitalGainsTax {
  const exempt = RULES.kapitalertragsteuer.teilfreistellung[options.fundType ?? 'other'];
  const taxableIncome = Math.max(0, income) * (1 - exempt);
  const exemptionUsed = Math.min(taxableIncome, Math.max(0, options.exemption));
  const taxBase = taxableIncome - exemptionUsed;
  const rate = capitalGainsTaxRate(options.churchTax);
  return {
    taxableIncome: round2(taxableIncome),
    exemptionUsed: round2(exemptionUsed),
    taxBase: round2(taxBase),
    tax: round2(taxBase * rate),
    rate,
  };
}

/**
 * Vorabpauschale: start value × Basiszins × 0.7, capped at the actual gain of the year,
 * reduced by distributions. Partial exemption is applied in capitalGainsTax.
 */
export function vorabpauschale(startValue: number, endValue: number, distributions = 0): number {
  const k = RULES.kapitalertragsteuer;
  const basisertrag = Math.max(0, startValue) * k.basiszins * k.vorabpauschaleFactor;
  const gain = Math.max(0, endValue - startValue + Math.max(0, distributions));
  return round2(Math.max(0, Math.min(basisertrag, gain) - Math.max(0, distributions)));
}

/** prämie = min(einzahlung, 700 bzw. 1.400) × 0,10, if income and minimum conditions hold. */
export function wohnungsbaupraemie(
  contribution: number,
  taxableIncome: number,
  joint: boolean,
): number {
  const w = RULES.wohnungsbaupraemie;
  const limit = joint ? w.incomeLimit.joint : w.incomeLimit.single;
  if (taxableIncome > limit || contribution < w.minContribution) return 0;
  return round2(
    Math.min(contribution, joint ? w.maxContribution.joint : w.maxContribution.single) * w.rate,
  );
}

/** zulage = min(vl_fonds, 400) × 0,20 + min(vl_bausparen, 470) × 0,09, if income ≤ limit. */
export function arbeitnehmerSparzulage(
  fundsContribution: number,
  buildingContribution: number,
  taxableIncome: number,
  joint: boolean,
): number {
  const v = RULES.vlSparen;
  if (taxableIncome > (joint ? v.incomeLimit.joint : v.incomeLimit.single)) return 0;
  return round2(
    Math.min(Math.max(0, fundsContribution), v.funds.maxContribution) * v.funds.rate +
      Math.min(Math.max(0, buildingContribution), v.building.maxContribution) * v.building.rate,
  );
}

/** Future value of a monthly savings plan: rate × ((1 + i)^n − 1) / i with i = yearly / 12. */
export function savingsPlanValue(
  monthlyRate: number,
  years: number,
  yearlyReturn: number,
  startCapital = 0,
): number {
  const n = Math.round(years * 12);
  const i = yearlyReturn / 12;
  const plan = i === 0 ? monthlyRate * n : (monthlyRate * ((1 + i) ** n - 1)) / i;
  const capital = startCapital * (1 + i) ** n;
  return round2(plan + capital);
}

/** Proposes Freistellungsaufträge proportional to the expected income per bank. */
export function distributeExemption(expected: number[], total: number): number[] {
  const sum = expected.reduce((a, b) => a + Math.max(0, b), 0);
  if (sum <= 0) return expected.map(() => 0);
  if (sum <= total) {
    // Everything fits: give each bank its expected income, the rest to the largest one.
    const result = expected.map((value) => Math.max(0, Math.round(value)));
    const rest = total - result.reduce((a, b) => a + b, 0);
    const largest = result.indexOf(Math.max(...result));
    result[largest] += Math.max(0, rest);
    return result;
  }
  const raw = expected.map((value) => (Math.max(0, value) / sum) * total);
  const result = raw.map(Math.floor);
  let rest = total - result.reduce((a, b) => a + b, 0);
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { index } of order) {
    if (rest <= 0) break;
    result[index] += 1;
    rest -= 1;
  }
  return result;
}

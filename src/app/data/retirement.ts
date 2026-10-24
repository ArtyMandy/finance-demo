import { capitalGainsTaxRate, type ChurchTax, RULES, sparerPauschbetrag } from '../rules/rules';
import { accountBalance } from './analytics';
import {
  Account,
  AccountType,
  AssetType,
  FinanceData,
  Month,
  Profile,
  RETIREMENT_ACCOUNT_TYPES,
  RetirementAssumptions,
} from './models';
import { isActiveIn, isSaving, monthlyEquivalent } from './recurring';

/**
 * Vorsorgevermögen: capital set aside for retirement (depots, Tagesgeld, rented or investment
 * properties) and a projection until retirement. All results are assumptions, no forecast.
 */

export type RetirementKind = 'depot' | 'cash' | 'realEstate';

const KIND_BY_TYPE: Partial<Record<AccountType, RetirementKind>> = {
  depot: 'depot',
  tagesgeld: 'cash',
  sachwert: 'realEstate',
};

/**
 * Share of a gain that is taxed after the Teilfreistellung. ETFs count as equity funds,
 * other funds as mixed funds. Crypto gains are not capital income (tax-free after one year
 * of holding), so they are left out of the Kapitalertragsteuer.
 */
const TAXED_SHARE: Record<AssetType, number> = {
  etf: 1 - RULES.kapitalertragsteuer.teilfreistellung.equity,
  fonds: 1 - RULES.kapitalertragsteuer.teilfreistellung.mixed,
  aktie: 1,
  anleihe: 1,
  sonstiges: 1,
  krypto: 0,
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export interface RetirementPosition {
  account: Account;
  kind: RetirementKind;
  /** Current value of the account. */
  value: number;
  /** Remaining debt of the linked loan (real estate only). */
  loan: number;
  /** Value minus linked loan; this is what counts. */
  netValue: number;
  /** Savings per month going into the account. */
  monthlyContribution: number;
  /** Purchase cost of the holdings; the current value when no holdings are entered. */
  costBasis: number;
  /** Share of a depot gain that is taxed (Teilfreistellung, weighted by holding value). */
  taxedShare: number;
}

export interface RetirementStatus {
  positions: RetirementPosition[];
  total: number;
  byKind: Record<RetirementKind, number>;
  monthlyContributions: number;
}

export function isRetirementAccount(account: Account): boolean {
  return account.retirement && RETIREMENT_ACCOUNT_TYPES.includes(account.type);
}

/**
 * Monthly savings into an account. For depots the savings plan rates of the holdings win, so a
 * recurring transfer to the same depot is not counted twice; otherwise recurring savings with
 * this account as target count (as a monthly average).
 */
export function monthlyContribution(data: FinanceData, account: Account, month: Month): number {
  if (account.type === 'depot') {
    const plans = data.holdings
      .filter((holding) => holding.accountId === account.id)
      .reduce((sum, holding) => sum + Math.max(0, holding.savingsPlan), 0);
    if (plans > 0) return plans;
  }
  return data.recurring
    .filter(
      (item) => isSaving(item) && item.targetAccountId === account.id && isActiveIn(item, month),
    )
    .reduce((sum, item) => sum + monthlyEquivalent(item), 0);
}

function depotTaxInfo(data: FinanceData, account: Account, value: number) {
  const holdings = data.holdings.filter((holding) => holding.accountId === account.id);
  const holdingsValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
  if (!holdings.length || holdingsValue <= 0) return { costBasis: value, taxedShare: 1 };
  return {
    costBasis: holdings.reduce((sum, h) => sum + h.quantity * h.buyPrice, 0),
    taxedShare:
      holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice * TAXED_SHARE[h.assetType], 0) /
      holdingsValue,
  };
}

/** Today's Vorsorgevermögen from the accounts marked for it. */
export function retirementStatus(data: FinanceData, month: Month): RetirementStatus {
  const positions = data.accounts.filter(isRetirementAccount).map((account) => {
    const kind = KIND_BY_TYPE[account.type]!;
    const value = accountBalance(data, account);
    const loanAccount =
      kind === 'realEstate' && account.linkedLoanId
        ? data.accounts.find((a) => a.id === account.linkedLoanId && a.type === 'kredit')
        : undefined;
    const loan = loanAccount ? -accountBalance(data, loanAccount) : 0;
    const tax =
      kind === 'depot' ? depotTaxInfo(data, account, value) : { costBasis: value, taxedShare: 0 };
    return {
      account,
      kind,
      value: round2(value),
      loan: round2(loan),
      netValue: round2(value - loan),
      monthlyContribution:
        kind === 'realEstate' ? 0 : round2(monthlyContribution(data, account, month)),
      costBasis: round2(tax.costBasis),
      taxedShare: tax.taxedShare,
    } satisfies RetirementPosition;
  });
  const byKind: Record<RetirementKind, number> = { depot: 0, cash: 0, realEstate: 0 };
  for (const position of positions) byKind[position.kind] += position.netValue;
  return {
    positions,
    total: round2(positions.reduce((sum, p) => sum + p.netValue, 0)),
    byKind: {
      depot: round2(byKind.depot),
      cash: round2(byKind.cash),
      realEstate: round2(byKind.realEstate),
    },
    monthlyContributions: round2(positions.reduce((sum, p) => sum + p.monthlyContribution, 0)),
  };
}

/** Full years until retirement, undefined while the birth year is not set. */
export function yearsUntilRetirement(profile: Profile, year: number): number | undefined {
  if (!profile.birthYear) return undefined;
  return Math.max(0, profile.birthYear + profile.retirementAge - year);
}

export interface ProjectionPoint {
  /** Years from today (0 = today). */
  offset: number;
  depot: number;
  cash: number;
  realEstate: number;
  total: number;
}

export interface RetirementTax {
  /** Gains of all depots (end value minus purchase cost and future contributions). */
  gain: number;
  /** Gain after Teilfreistellung. */
  taxableGain: number;
  exemptionUsed: number;
  taxBase: number;
  rate: number;
  tax: number;
}

export interface RetirementProjection {
  years: number;
  points: ProjectionPoint[];
  /** Value at retirement before tax. */
  gross: number;
  /** Contributions paid in from today until retirement. */
  paidIn: number;
  tax: RetirementTax;
  /** Value at retirement after Kapitalertragsteuer. */
  net: number;
  /** `net` in today's money (inflation-adjusted). */
  realNet: number;
}

export interface ProjectionOptions {
  years: number;
  assumptions: RetirementAssumptions;
  jointAssessment: boolean;
  churchTax: ChurchTax;
}

function yearlyRate(kind: RetirementKind, assumptions: RetirementAssumptions): number {
  if (kind === 'depot') return assumptions.depotReturn;
  if (kind === 'cash') return assumptions.cashReturn;
  return assumptions.realEstateGrowth;
}

/**
 * Projects every position month by month: interest of yearly rate / 12 per month, savings at
 * the end of each month (same as savingsPlanValue), rates rising by `contributionGrowth`
 * once a year. Loans stay as they are today. At the end all depots are assumed sold at once:
 * Kapitalertragsteuer on the gains after Teilfreistellung, Sparerpauschbetrag used once.
 * Tagesgeld interest is taxed every year (cashReturn is after tax), properties are left out
 * (tax-free after the speculation period).
 */
export function projectRetirement(
  positions: readonly RetirementPosition[],
  options: ProjectionOptions,
): RetirementProjection {
  const { assumptions } = options;
  const years = Math.max(0, Math.round(options.years));
  const states = positions.map((position) => ({
    position,
    value: position.value,
    paidIn: 0,
    rate: position.monthlyContribution,
    monthly: yearlyRate(position.kind, assumptions) / 12,
  }));

  const snapshot = (offset: number): ProjectionPoint => {
    const point = { offset, depot: 0, cash: 0, realEstate: 0, total: 0 };
    for (const state of states) {
      const net = state.value - state.position.loan;
      point[state.position.kind] += net;
      point.total += net;
    }
    return {
      offset,
      depot: round2(point.depot),
      cash: round2(point.cash),
      realEstate: round2(point.realEstate),
      total: round2(point.total),
    };
  };

  const points = [snapshot(0)];
  for (let year = 1; year <= years; year++) {
    for (let month = 0; month < 12; month++) {
      for (const state of states) {
        state.value = state.value * (1 + state.monthly) + state.rate;
        state.paidIn += state.rate;
      }
    }
    for (const state of states) state.rate *= 1 + assumptions.contributionGrowth;
    points.push(snapshot(year));
  }

  let gain = 0;
  let taxableGain = 0;
  for (const state of states) {
    if (state.position.kind !== 'depot') continue;
    const depotGain = Math.max(0, state.value - state.position.costBasis - state.paidIn);
    gain += depotGain;
    taxableGain += depotGain * state.position.taxedShare;
  }
  const exemptionUsed = Math.min(taxableGain, sparerPauschbetrag(options.jointAssessment));
  const taxBase = taxableGain - exemptionUsed;
  const rate = capitalGainsTaxRate(options.churchTax);
  const tax = taxBase * rate;

  const gross = points.at(-1)!.total;
  const net = gross - tax;
  return {
    years,
    points,
    gross,
    paidIn: round2(states.reduce((sum, s) => sum + s.paidIn, 0)),
    tax: {
      gain: round2(gain),
      taxableGain: round2(taxableGain),
      exemptionUsed: round2(exemptionUsed),
      taxBase: round2(taxBase),
      rate,
      tax: round2(tax),
    },
    net: round2(net),
    realNet: round2(net / (1 + assumptions.inflation) ** years),
  };
}

export interface ReturnScenario {
  depotReturn: number;
  projection: RetirementProjection;
}

/** The projection for each depot return of RULES.vorsorge.returnScenarios. */
export function returnScenarios(
  positions: readonly RetirementPosition[],
  options: ProjectionOptions,
): ReturnScenario[] {
  return RULES.vorsorge.returnScenarios.map((depotReturn) => ({
    depotReturn,
    projection: projectRetirement(positions, {
      ...options,
      assumptions: { ...options.assumptions, depotReturn },
    }),
  }));
}

import { RULES, savingsPlanValue } from '../rules/rules';
import {
  Account,
  emptyFinanceData,
  FinanceData,
  Holding,
  RecurringItem,
  RetirementAssumptions,
} from './models';
import {
  projectRetirement,
  ProjectionOptions,
  retirementStatus,
  returnScenarios,
  yearsUntilRetirement,
} from './retirement';

function account(partial: Partial<Account> & Pick<Account, 'id' | 'type'>): Account {
  return {
    name: partial.id,
    institution: '',
    openingBalance: 0,
    valuations: [],
    retirement: true,
    linkedLoanId: '',
    ...partial,
  };
}

function holding(partial: Partial<Holding>): Holding {
  return {
    id: 'etf',
    accountId: 'depot',
    name: 'MSCI World',
    isin: '',
    assetType: 'etf',
    quantity: 100,
    buyPrice: 80,
    currentPrice: 100,
    savingsPlan: 200,
    ...partial,
  };
}

const saving: RecurringItem = {
  id: 'tg-rate',
  seriesId: 'tg-rate',
  kind: 'expense',
  name: 'Sparrate Tagesgeld',
  amount: 100,
  rhythm: 'monthly',
  from: '2026-01',
  to: '',
  categoryId: 'sparen',
  targetAccountId: 'tg',
  provider: '',
  customerNumber: '',
  cancelBy: '',
  monthlyCancelable: false,
  status: 'active',
};

const value = (amount: number) => [{ date: '2026-01-01', value: amount }];

function finance(partial: Partial<FinanceData> = {}): FinanceData {
  return {
    ...emptyFinanceData(),
    accounts: [
      account({ id: 'depot', type: 'depot', valuations: value(9000) }),
      account({ id: 'tg', type: 'tagesgeld', valuations: value(5000) }),
      account({ id: 'wohnung', type: 'sachwert', valuations: value(200000), linkedLoanId: 'loan' }),
      account({ id: 'loan', type: 'kredit', valuations: value(120000), retirement: false }),
      account({ id: 'giro', type: 'giro', valuations: value(3000) }),
      account({ id: 'auto', type: 'sachwert', valuations: value(9000), retirement: false }),
    ],
    holdings: [holding({})],
    recurring: [saving],
    ...partial,
  };
}

const zero: RetirementAssumptions = {
  depotReturn: 0,
  cashReturn: 0,
  realEstateGrowth: 0,
  contributionGrowth: 0,
  inflation: 0,
};

const options = (years: number, assumptions: Partial<RetirementAssumptions> = {}) =>
  ({
    years,
    assumptions: { ...zero, ...assumptions },
    jointAssessment: false,
    churchTax: 0,
  }) satisfies ProjectionOptions;

describe('retirementStatus', () => {
  const status = retirementStatus(finance(), '2026-10');

  it('counts only marked depots, Tagesgeld and Sachwerte', () => {
    expect(status.positions.map((p) => p.account.id)).toEqual(['depot', 'tg', 'wohnung']);
  });

  it('uses the live holdings value and subtracts the linked loan from the property', () => {
    expect(status.byKind).toEqual({ depot: 10000, cash: 5000, realEstate: 80000 });
    expect(status.total).toBe(95000);
  });

  it('takes savings plans from holdings and recurring savings into the account', () => {
    expect(status.positions.map((p) => p.monthlyContribution)).toEqual([200, 100, 0]);
    expect(status.monthlyContributions).toBe(300);
  });

  it('does not count a transfer to a depot twice when its holdings have savings plans', () => {
    const data = finance({ recurring: [saving, { ...saving, id: 'd', targetAccountId: 'depot' }] });
    expect(retirementStatus(data, '2026-10').positions[0].monthlyContribution).toBe(200);
  });

  it('weights the Teilfreistellung by the value of the holdings', () => {
    const data = finance({
      holdings: [holding({}), holding({ id: 'btc', assetType: 'krypto', savingsPlan: 0 })],
    });
    const depot = retirementStatus(data, '2026-10').positions[0];
    expect(depot.taxedShare).toBeCloseTo(0.35);
    expect(depot.costBasis).toBe(16000);
  });
});

describe('yearsUntilRetirement', () => {
  it('counts from the birth year and retirement age', () => {
    const profile = { ...emptyFinanceData().profile, birthYear: 1990 };
    expect(yearsUntilRetirement(profile, 2026)).toBe(31);
    expect(yearsUntilRetirement({ ...profile, retirementAge: 30 }, 2026)).toBe(0);
  });

  it('is undefined without a birth year', () => {
    expect(yearsUntilRetirement(emptyFinanceData().profile, 2026)).toBeUndefined();
  });
});

describe('projectRetirement', () => {
  const positions = retirementStatus(finance(), '2026-10').positions;

  it('adds the savings without returns', () => {
    const result = projectRetirement(positions, options(1));
    expect(result.points.at(-1)).toEqual({
      offset: 1,
      depot: 12400,
      cash: 6200,
      realEstate: 80000,
      total: 98600,
    });
    expect(result.paidIn).toBe(3600);
  });

  it('matches the savings plan formula for a depot', () => {
    const result = projectRetirement(positions.slice(0, 1), options(10, { depotReturn: 0.06 }));
    expect(result.gross).toBeCloseTo(savingsPlanValue(200, 10, 0.06, 10000), 1);
    expect(result.points).toHaveLength(11);
  });

  it('raises the rates once a year', () => {
    expect(projectRetirement(positions, options(2, { contributionGrowth: 0.1 })).paidIn).toBe(
      12 * 300 + 12 * 330,
    );
  });

  it('shows the Kapitalertragsteuer on depot gains after Teilfreistellung and allowance', () => {
    // Gain 2,000 € × 70 % = 1,400 € − 1,000 € Sparerpauschbetrag = 400 € × 26.375 %.
    const result = projectRetirement(positions, options(0));
    expect(result.tax).toEqual({
      gain: 2000,
      taxableGain: 1400,
      exemptionUsed: 1000,
      taxBase: 400,
      rate: RULES.kapitalertragsteuer.rate.none,
      tax: 105.5,
    });
    expect(result.net).toBe(95000 - 105.5);
  });

  it('does not tax future contributions, only the gain on them', () => {
    const result = projectRetirement(positions.slice(0, 1), options(5));
    expect(result.tax.gain).toBe(2000);
  });

  it('uses the doubled allowance for joint assessment', () => {
    const result = projectRetirement(positions, { ...options(0), jointAssessment: true });
    expect(result.tax.tax).toBe(0);
  });

  it('adjusts the net value for inflation', () => {
    const result = projectRetirement(positions, options(10, { inflation: 0.02 }));
    expect(result.realNet).toBeCloseTo(result.net / 1.02 ** 10, 1);
  });

  it('calculates every return scenario', () => {
    const scenarios = returnScenarios(positions, options(20));
    expect(scenarios.map((s) => s.depotReturn)).toEqual([...RULES.vorsorge.returnScenarios]);
    expect(scenarios[3].projection.gross).toBeGreaterThan(scenarios[0].projection.gross);
  });
});

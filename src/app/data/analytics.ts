import {
  Account,
  CASH_ACCOUNT_TYPES,
  RETIREMENT_ACCOUNT_TYPES,
  FinanceData,
  IsoDate,
  Month,
  RecurringItem,
  WealthOptions,
} from './models';
import { lastDayOf } from './months';
import { amountInMonth, isActiveIn, isSaving, monthlyEquivalent, plannedTotal } from './recurring';

export const isCash = (account: Account) => CASH_ACCOUNT_TYPES.includes(account.type);

/** Current value of all holdings in a depot, undefined when it has none. */
export function holdingsValue(data: FinanceData, accountId: string): number | undefined {
  const holdings = data.holdings.filter((holding) => holding.accountId === accountId);
  if (!holdings.length) return undefined;
  return holdings.reduce((sum, holding) => sum + holding.quantity * holding.currentPrice, 0);
}

/**
 * Balance of an account at the end of a day (today when `until` is empty), from the values
 * entered on the accounts page. Bookings do not change it. Loans count negative.
 * Depots with holdings use the live holdings value for today.
 */
export function accountBalance(data: FinanceData, account: Account, until?: IsoDate): number {
  let value: number | undefined;
  if (!until && account.type === 'depot') value = holdingsValue(data, account.id);
  if (value === undefined) {
    const valuations = account.valuations
      .filter((valuation) => !until || valuation.date <= until)
      .sort((a, b) => a.date.localeCompare(b.date));
    value = valuations.at(-1)?.value ?? account.openingBalance;
  }
  return account.type === 'kredit' ? -Math.abs(value) : value;
}

/** Counts towards the Vorsorgevermögen (only depots, Tagesgeld and Sachwerte can). */
export function isRetirementAccount(account: Account): boolean {
  return account.retirement && RETIREMENT_ACCOUNT_TYPES.includes(account.type);
}

export interface WealthParts {
  cash: number;
  investments: number;
  other: number;
  debts: number;
}

export interface WealthBreakdown extends WealthParts {
  total: number;
  /**
   * Part of each category that belongs to the Vorsorgevermögen: the marked accounts and the
   * loans linked to marked properties.
   */
  retirement: WealthParts;
}

const noParts = (): WealthParts => ({ cash: 0, investments: 0, other: 0, debts: 0 });

function addTo(parts: WealthParts, account: Account, balance: number): void {
  if (account.type === 'kredit') parts.debts += -balance;
  else if (account.type === 'depot') parts.investments += balance;
  else if (account.type === 'sachwert') parts.other += balance;
  else parts.cash += balance;
}

export function wealthBreakdown(data: FinanceData, until?: IsoDate): WealthBreakdown {
  const result: WealthBreakdown = { ...noParts(), total: 0, retirement: noParts() };
  const linkedLoans = new Set(
    data.accounts
      .filter((account) => isRetirementAccount(account) && account.type === 'sachwert')
      .map((account) => account.linkedLoanId),
  );
  for (const account of data.accounts) {
    const balance = accountBalance(data, account, until);
    addTo(result, account, balance);
    const linkedLoan = account.type === 'kredit' && linkedLoans.has(account.id);
    if (isRetirementAccount(account) || linkedLoan) addTo(result.retirement, account, balance);
    result.total += balance;
  }
  return result;
}

/**
 * The categories as the overview shows them: Sachwerte, debts and the Vorsorgevermögen left out
 * when the options say so.
 */
export function visibleWealth(wealth: WealthBreakdown, options: WealthOptions): WealthParts {
  const r = options.includeRetirement ? noParts() : wealth.retirement;
  return {
    cash: wealth.cash - r.cash,
    investments: wealth.investments - r.investments,
    other: options.includeAssets ? wealth.other - r.other : 0,
    debts: options.includeDebts ? wealth.debts - r.debts : 0,
  };
}

/** Net worth with Sachwerte, debts or the Vorsorgevermögen left out when the options say so. */
export function wealthTotal(wealth: WealthBreakdown, options: WealthOptions): number {
  const parts = visibleWealth(wealth, options);
  return parts.cash + parts.investments + parts.other - parts.debts;
}

/** Vorsorgevermögen contained in the net worth as the options count it. */
export function includedRetirement(wealth: WealthBreakdown, options: WealthOptions): number {
  if (!options.includeRetirement) return 0;
  const r = wealth.retirement;
  return (
    r.cash +
    r.investments +
    (options.includeAssets ? r.other : 0) -
    (options.includeDebts ? r.debts : 0)
  );
}

/** Net worth at the end of each month; the current month uses today's values. */
export function wealthHistory(
  data: FinanceData,
  months: readonly Month[],
  currentMonth: Month,
  options: WealthOptions = data.wealthOptions,
): number[] {
  return months.map((month) =>
    wealthTotal(
      wealthBreakdown(data, month === currentMonth ? undefined : lastDayOf(month)),
      options,
    ),
  );
}

export interface MonthTotals {
  income: number;
  /** Spending, without savings to own accounts. */
  expenses: number;
  /** Expenses that go to an own account or depot. */
  savings: number;
}

/** Income, spending and savings of a month from the defined income and expenses. */
export function monthTotals(data: FinanceData, month: Month): MonthTotals {
  const savings = plannedTotal(data.recurring.filter(isSaving), 'expense', month);
  return {
    income: plannedTotal(data.recurring, 'income', month),
    expenses: plannedTotal(data.recurring, 'expense', month) - savings,
    savings,
  };
}

/** Monthly amount flowing into an account from savings expenses (monthly average). */
export function monthlyInflow(data: FinanceData, accountId: string, month: Month): number {
  return data.recurring
    .filter(
      (item) => item.targetAccountId === accountId && isSaving(item) && isActiveIn(item, month),
    )
    .reduce((sum, item) => sum + monthlyEquivalent(item), 0);
}

export interface CategoryAmount {
  categoryId: string;
  amount: number;
}

export function spendingByCategory(data: FinanceData, month: Month): CategoryAmount[] {
  const totals = new Map<string, number>();
  for (const item of data.recurring) {
    if (item.kind !== 'expense' || isSaving(item)) continue;
    const amount = amountInMonth(item, month);
    if (amount) totals.set(item.categoryId, (totals.get(item.categoryId) ?? 0) + amount);
  }
  return [...totals]
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export interface DueItem {
  item: RecurringItem;
  amount: number;
}

/** Income and expenses that fall due in the month, income first. */
export function dueItems(data: FinanceData, month: Month): DueItem[] {
  return data.recurring
    .map((item) => ({ item, amount: amountInMonth(item, month) }))
    .filter((entry) => entry.amount > 0)
    .sort(
      (a, b) =>
        Number(a.item.kind !== 'income') - Number(b.item.kind !== 'income') || b.amount - a.amount,
    );
}

/** Planned income for a month from the income sources. */
export function plannedIncome(data: FinanceData, month: Month): number {
  return plannedTotal(data.recurring, 'income', month);
}

/** Liquid reserve for the emergency fund check: all Tagesgeld accounts. */
export function liquidReserve(data: FinanceData): number {
  return data.accounts
    .filter((account) => account.type === 'tagesgeld')
    .reduce((sum, account) => sum + accountBalance(data, account), 0);
}

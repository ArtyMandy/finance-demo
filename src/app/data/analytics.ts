import { Account, CASH_ACCOUNT_TYPES, FinanceData, IsoDate, Month, RecurringItem } from './models';
import { lastDayOf } from './months';
import { amountInMonth, plannedTotal } from './recurring';

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

export interface WealthBreakdown {
  cash: number;
  investments: number;
  other: number;
  debts: number;
  total: number;
}

export function wealthBreakdown(data: FinanceData, until?: IsoDate): WealthBreakdown {
  const result: WealthBreakdown = { cash: 0, investments: 0, other: 0, debts: 0, total: 0 };
  for (const account of data.accounts) {
    const balance = accountBalance(data, account, until);
    if (account.type === 'kredit') result.debts += -balance;
    else if (account.type === 'depot') result.investments += balance;
    else if (account.type === 'sachwert') result.other += balance;
    else result.cash += balance;
    result.total += balance;
  }
  return result;
}

/** Net worth at the end of each month; the current month uses today's values. */
export function wealthHistory(
  data: FinanceData,
  months: readonly Month[],
  currentMonth: Month,
): number[] {
  return months.map(
    (month) => wealthBreakdown(data, month === currentMonth ? undefined : lastDayOf(month)).total,
  );
}

export interface MonthTotals {
  income: number;
  expenses: number;
}

/** Income and expenses of a month from the defined income sources and fixed expenses. */
export function monthTotals(data: FinanceData, month: Month): MonthTotals {
  return {
    income: plannedTotal(data.recurring, 'income', month),
    expenses: plannedTotal(data.recurring, 'expense', month),
  };
}

export interface CategoryAmount {
  categoryId: string;
  amount: number;
}

export function spendingByCategory(data: FinanceData, month: Month): CategoryAmount[] {
  const totals = new Map<string, number>();
  for (const item of data.recurring) {
    if (item.kind !== 'expense') continue;
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

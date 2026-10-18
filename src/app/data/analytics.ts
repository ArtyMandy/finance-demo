import { isNeutralCategory } from './categories';
import {
  Account,
  CASH_ACCOUNT_TYPES,
  FinanceData,
  IsoDate,
  Month,
  RecurringItem,
  Transaction,
} from './models';
import { lastDayOf, monthOf } from './months';
import { amountInMonth } from './recurring';

export const isCash = (account: Account) => CASH_ACCOUNT_TYPES.includes(account.type);

export const isIncome = (tx: Transaction) => tx.amount > 0 && !isNeutralCategory(tx.categoryId);
export const isSpending = (tx: Transaction) => tx.amount < 0 && !isNeutralCategory(tx.categoryId);

/** Current value of all holdings in a depot, undefined when it has none. */
export function holdingsValue(data: FinanceData, accountId: string): number | undefined {
  const holdings = data.holdings.filter((holding) => holding.accountId === accountId);
  if (!holdings.length) return undefined;
  return holdings.reduce((sum, holding) => sum + holding.quantity * holding.currentPrice, 0);
}

/**
 * Balance of an account at the end of a day (today when `until` is empty).
 * Loans count negative. Depots with holdings use the live holdings value for today.
 */
export function accountBalance(data: FinanceData, account: Account, until?: IsoDate): number {
  if (isCash(account)) {
    return data.transactions
      .filter((tx) => tx.accountId === account.id && (!until || tx.date <= until))
      .reduce((sum, tx) => sum + tx.amount, account.openingBalance);
  }
  let value: number | undefined;
  if (!until && account.type === 'depot') value = holdingsValue(data, account.id);
  if (value === undefined) {
    const valuations = account.valuations
      .filter((valuation) => !until || valuation.date <= until)
      .sort((a, b) => a.date.localeCompare(b.date));
    value = valuations.at(-1)?.value ?? 0;
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

export function transactionsIn(data: FinanceData, month: Month): Transaction[] {
  return data.transactions.filter((tx) => monthOf(tx.date) === month);
}

export interface MonthTotals {
  income: number;
  expenses: number;
}

/** Actual income and spending from bookings; transfers and savings are left out. */
export function monthTotals(data: FinanceData, month: Month): MonthTotals {
  let income = 0;
  let expenses = 0;
  for (const tx of transactionsIn(data, month)) {
    if (isIncome(tx)) income += tx.amount;
    else if (isSpending(tx)) expenses += -tx.amount;
  }
  return { income, expenses };
}

export interface CategoryAmount {
  categoryId: string;
  amount: number;
}

export function spendingByCategory(data: FinanceData, month: Month): CategoryAmount[] {
  const totals = new Map<string, number>();
  for (const tx of transactionsIn(data, month)) {
    if (isSpending(tx)) totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) - tx.amount);
  }
  return [...totals]
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount);
}

const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-zäöüß0-9]+/)
    .filter((word) => word.length >= 4);

/** A booking "pays" a planned item when the sign matches, the amount is close and a name word matches. */
function matches(item: RecurringItem, tx: Transaction): boolean {
  const sign = item.kind === 'income' ? 1 : -1;
  if (Math.sign(tx.amount) !== sign) return false;
  const closeAmount = Math.abs(Math.abs(tx.amount) - item.amount) <= item.amount * 0.1;
  if (!closeAmount) return false;
  if (Math.abs(Math.abs(tx.amount) - item.amount) < 0.005) return true;
  const haystack = `${tx.counterparty} ${tx.purpose}`.toLowerCase();
  return [...words(item.name), ...words(item.provider)].some((word) => haystack.includes(word));
}

export interface PendingItem {
  item: RecurringItem;
  amount: number;
}

/** Planned income and expenses of the month that have no matching booking yet. */
export function pendingItems(data: FinanceData, month: Month): PendingItem[] {
  const bookings = transactionsIn(data, month);
  const used = new Set<string>();
  const pending: PendingItem[] = [];
  for (const item of data.recurring) {
    const amount = amountInMonth(item, month);
    if (!amount) continue;
    const booking = bookings.find((tx) => !used.has(tx.id) && matches(item, tx));
    if (booking) used.add(booking.id);
    else pending.push({ item, amount });
  }
  return pending.sort((a, b) => a.item.kind.localeCompare(b.item.kind) || b.amount - a.amount);
}

export interface MonthPreview {
  incomeActual: number;
  incomePending: number;
  expensesActual: number;
  expensesPending: number;
  /** Expected rest at the end of the month. */
  leftover: number;
  pending: PendingItem[];
}

export function monthPreview(data: FinanceData, month: Month): MonthPreview {
  const totals = monthTotals(data, month);
  const pending = pendingItems(data, month);
  const incomePending = pending
    .filter((p) => p.item.kind === 'income')
    .reduce((sum, p) => sum + p.amount, 0);
  const expensesPending = pending
    .filter((p) => p.item.kind === 'expense')
    .reduce((sum, p) => sum + p.amount, 0);
  return {
    incomeActual: totals.income,
    incomePending,
    expensesActual: totals.expenses,
    expensesPending,
    leftover: totals.income + incomePending - totals.expenses - expensesPending,
    pending,
  };
}

/** Planned income for a month from the income sources, used when there are no bookings. */
export function plannedIncome(data: FinanceData, month: Month): number {
  return data.recurring
    .filter((item) => item.kind === 'income')
    .reduce((sum, item) => sum + amountInMonth(item, month), 0);
}

/** Liquid reserve for the emergency fund check: all Tagesgeld accounts. */
export function liquidReserve(data: FinanceData): number {
  return data.accounts
    .filter((account) => account.type === 'tagesgeld')
    .reduce((sum, account) => sum + accountBalance(data, account), 0);
}

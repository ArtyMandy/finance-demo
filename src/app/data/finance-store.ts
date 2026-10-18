import { computed, DOCUMENT, inject, Service, signal } from '@angular/core';
import { Clock } from '../core/clock';
import { categorize, normalizeCounterparty } from './categories';
import type { ParsedBooking } from './ing-csv';
import type { ContractSuggestion } from './insights';
import {
  Account,
  emptyFinanceData,
  FinanceData,
  Goal,
  Holding,
  Month,
  Profile,
  RecurringItem,
  Transaction,
} from './models';
import { addMonths } from './months';

const STORAGE_KEY = 'finanz-demo:data:v1';

type ListKey =
  | 'accounts'
  | 'transactions'
  | 'recurring'
  | 'goals'
  | 'holdings'
  | 'dividends'
  | 'exemptionOrders'
  | 'pension';
type ListItem<K extends ListKey> = FinanceData[K][number];

export const newId = () => crypto.randomUUID();

/** Fills in fields missing from older saved data. */
export function normalizeData(raw: unknown): FinanceData {
  const base = emptyFinanceData();
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<FinanceData>;
  return {
    ...base,
    ...data,
    version: 1,
    profile: { ...base.profile, ...data.profile },
    accounts: (data.accounts ?? []).map((account) => ({
      ...account,
      valuations: account.valuations ?? [],
    })),
  };
}

export interface ImportResult {
  added: number;
  skipped: number;
}

/**
 * All finance data of the user. Lives in the browser (localStorage), so the app works
 * without an account and offline; FinanceSync mirrors it to Supabase when signed in.
 */
@Service()
export class FinanceStore {
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage;
  private readonly clock = inject(Clock);
  private readonly state = signal<FinanceData>(this.load());

  readonly data = this.state.asReadonly();
  readonly isEmpty = computed(() => {
    const d = this.state();
    return !d.accounts.length && !d.recurring.length && !d.transactions.length && !d.goals.length;
  });

  private load(): FinanceData {
    try {
      const text = this.storage?.getItem(STORAGE_KEY);
      return text ? normalizeData(JSON.parse(text)) : emptyFinanceData();
    } catch {
      return emptyFinanceData();
    }
  }

  /** Saves right away (not in an effect), so nothing is lost when the tab closes. */
  private set(data: FinanceData): void {
    this.state.set(data);
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or blocked (private mode); data stays in memory for this session.
    }
  }

  private change(update: (data: FinanceData) => FinanceData): void {
    this.set({ ...update(this.state()), updatedAt: new Date().toISOString() });
  }

  /** Replaces everything, e.g. from a backup or the cloud. Keeps the given timestamp. */
  replace(data: FinanceData): void {
    this.set(normalizeData(data));
  }

  clear(): void {
    this.change(() => emptyFinanceData());
  }

  // Generic list helpers

  save<K extends ListKey>(key: K, item: ListItem<K>): void {
    this.change((data) => {
      const list = data[key] as ListItem<K>[];
      const exists = list.some((entry) => entry.id === item.id);
      return {
        ...data,
        [key]: exists
          ? list.map((entry) => (entry.id === item.id ? item : entry))
          : [...list, item],
      };
    });
  }

  remove<K extends ListKey>(key: K, id: string): void {
    this.change((data) => ({
      ...data,
      [key]: (data[key] as ListItem<K>[]).filter((entry) => entry.id !== id),
    }));
  }

  updateProfile(profile: Profile): void {
    this.change((data) => ({ ...data, profile }));
  }

  // Accounts

  removeAccount(id: string): void {
    this.change((data) => {
      const holdingIds = new Set(data.holdings.filter((h) => h.accountId === id).map((h) => h.id));
      return {
        ...data,
        accounts: data.accounts.filter((account) => account.id !== id),
        transactions: data.transactions.filter((tx) => tx.accountId !== id),
        holdings: data.holdings.filter((h) => h.accountId !== id),
        dividends: data.dividends.filter((d) => !holdingIds.has(d.holdingId)),
      };
    });
  }

  /** Records today's value of a depot, asset or loan (one value per day). */
  setValuation(accountId: string, value: number): void {
    const date = this.clock.today();
    this.change((data) => ({
      ...data,
      accounts: data.accounts.map((account: Account) =>
        account.id === accountId
          ? {
              ...account,
              valuations: [...account.valuations.filter((v) => v.date !== date), { date, value }],
            }
          : account,
      ),
    }));
  }

  // Holdings: keep the depot's value history in step with its holdings.

  saveHolding(holding: Holding): void {
    this.save('holdings', holding);
    this.recordDepotValue(holding.accountId);
  }

  removeHolding(holding: Holding): void {
    this.change((data) => ({
      ...data,
      holdings: data.holdings.filter((h) => h.id !== holding.id),
      dividends: data.dividends.filter((d) => d.holdingId !== holding.id),
    }));
    this.recordDepotValue(holding.accountId);
  }

  private recordDepotValue(accountId: string): void {
    const value = this.state()
      .holdings.filter((h) => h.accountId === accountId)
      .reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
    this.setValuation(accountId, Math.round(value * 100) / 100);
  }

  // Transactions

  addTransaction(input: Omit<Transaction, 'id' | 'categoryManual' | 'importKey'>): void {
    const categoryId = input.categoryId || categorize(input, this.state().categoryRules);
    this.save('transactions', {
      ...input,
      id: newId(),
      categoryId,
      categoryManual: !!input.categoryId,
      importKey: '',
    });
  }

  /**
   * Corrects a booking's category and learns it: other bookings from the same counterparty
   * that were categorized automatically move along, and future imports use the rule.
   */
  setCategory(id: string, categoryId: string): void {
    this.change((data) => {
      const tx = data.transactions.find((entry) => entry.id === id);
      if (!tx) return data;
      const pattern = normalizeCounterparty(tx.counterparty);
      const categoryRules = pattern
        ? [
            ...data.categoryRules.filter((rule) => rule.pattern !== pattern),
            { pattern, categoryId },
          ]
        : data.categoryRules;
      return {
        ...data,
        categoryRules,
        transactions: data.transactions.map((entry) => {
          if (entry.id === id) return { ...entry, categoryId, categoryManual: true };
          if (
            pattern &&
            !entry.categoryManual &&
            normalizeCounterparty(entry.counterparty) === pattern
          ) {
            return { ...entry, categoryId };
          }
          return entry;
        }),
      };
    });
  }

  /** Adds CSV bookings to an account, skipping ones that were imported before. */
  importBookings(accountId: string, bookings: readonly ParsedBooking[]): ImportResult {
    const data = this.state();
    const existing = new Set(
      data.transactions.filter((tx) => tx.accountId === accountId).map((tx) => tx.importKey),
    );
    const fresh = bookings.filter((booking) => !existing.has(booking.importKey));
    const transactions: Transaction[] = fresh.map((booking) => ({
      id: newId(),
      accountId,
      date: booking.date,
      amount: booking.amount,
      counterparty: booking.counterparty,
      purpose: [booking.bookingText, booking.purpose].filter(Boolean).join(' · '),
      categoryId: categorize(booking, data.categoryRules),
      categoryManual: false,
      importKey: booking.importKey,
    }));
    if (transactions.length)
      this.change((d) => ({ ...d, transactions: [...d.transactions, ...transactions] }));
    return { added: transactions.length, skipped: bookings.length - fresh.length };
  }

  /** Keys bookings would get on import, to show duplicates before importing. */
  existingImportKeys(accountId: string): Set<string> {
    return new Set(
      this.state()
        .transactions.filter((tx) => tx.accountId === accountId)
        .map((tx) => tx.importKey),
    );
  }

  // Income and fixed costs

  /**
   * Changes the amount from a month on: the current period ends the month before and a new
   * period of the same series starts, so the history stays intact.
   */
  changeAmountFrom(item: RecurringItem, month: Month, amount: number): void {
    if (month <= item.from) {
      this.save('recurring', { ...item, amount });
      return;
    }
    this.change((data) => ({
      ...data,
      recurring: [
        ...data.recurring.map((entry) =>
          entry.id === item.id ? { ...entry, to: addMonths(month, -1) } : entry,
        ),
        { ...item, id: newId(), amount, from: month },
      ],
    }));
  }

  acceptSuggestion(suggestion: ContractSuggestion): void {
    this.save('recurring', {
      id: newId(),
      seriesId: newId(),
      kind: 'expense',
      name: suggestion.name,
      amount: suggestion.amount,
      rhythm: suggestion.rhythm,
      from: suggestion.firstMonth,
      to: '',
      categoryId: suggestion.categoryId,
      provider: suggestion.name,
      customerNumber: '',
      cancelBy: '',
      monthlyCancelable: false,
      status: 'active',
    });
  }

  dismissSuggestion(key: string): void {
    this.change((data) => ({ ...data, dismissedSuggestions: [...data.dismissedSuggestions, key] }));
  }

  // Budgets

  setBudget(categoryId: string, limit: number): void {
    this.change((data) => ({
      ...data,
      budgets: [
        ...data.budgets.filter((budget) => budget.categoryId !== categoryId),
        ...(limit > 0 ? [{ categoryId, limit }] : []),
      ],
    }));
  }

  // Goals

  deposit(goal: Goal, amount: number): void {
    const saved = Math.round((goal.saved + amount) * 100) / 100;
    const achievedMonth = saved >= goal.target ? goal.achievedMonth || this.clock.month() : '';
    this.save('goals', { ...goal, saved: Math.max(0, saved), achievedMonth });
  }
}

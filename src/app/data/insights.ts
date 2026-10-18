import { isSpending, spendingByCategory, transactionsIn } from './analytics';
import { categorize, categoryName, isNeutralCategory, normalizeCounterparty } from './categories';
import type { FinanceData, IsoDate, Month, RecurringItem, Rhythm, Transaction } from './models';
import { addDays, addMonths, daysBetween, monthOf } from './months';
import { isActiveIn, isCurrentOrFuture, monthlyEquivalent } from './recurring';

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export interface ContractSuggestion {
  key: string;
  name: string;
  amount: number;
  rhythm: Rhythm;
  categoryId: string;
  firstMonth: Month;
  count: number;
}

function rhythmFor(days: number): Rhythm | undefined {
  if (days >= 26 && days <= 35) return 'monthly';
  if (days >= 85 && days <= 96) return 'quarterly';
  if (days >= 355 && days <= 375) return 'yearly';
  return undefined;
}

const titleCase = (text: string) => text.replace(/(^|\s)\S/g, (char) => char.toUpperCase());

/**
 * Finds recurring payments in the bookings: same counterparty, similar amount (±15 %)
 * and a regular gap. Already known contracts and dismissed suggestions are skipped.
 */
export function detectContracts(data: FinanceData): ContractSuggestion[] {
  const groups = new Map<string, Transaction[]>();
  for (const tx of data.transactions) {
    // Transfers between own accounts and savings plans are not contracts.
    if (tx.amount >= 0 || isNeutralCategory(tx.categoryId)) continue;
    const key = normalizeCounterparty(tx.counterparty);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), tx]);
  }

  const known = data.recurring
    .filter((item) => item.kind === 'expense')
    .map((item) => `${item.name} ${item.provider}`.toLowerCase());

  const suggestions: ContractSuggestion[] = [];
  for (const [key, list] of groups) {
    if (data.dismissedSuggestions.includes(key)) continue;
    if (
      known.some((text) => key.split(' ').some((word) => word.length >= 4 && text.includes(word)))
    )
      continue;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const gaps = sorted.slice(1).map((tx, index) => daysBetween(sorted[index].date, tx.date));
    if (!gaps.length) continue;
    const rhythm = rhythmFor(median(gaps));
    if (!rhythm || (rhythm !== 'yearly' && sorted.length < 3)) continue;
    const amounts = sorted.map((tx) => -tx.amount);
    const typical = median(amounts);
    if (amounts.some((amount) => Math.abs(amount - typical) > typical * 0.15)) continue;
    const last = sorted.at(-1)!;
    suggestions.push({
      key,
      name: titleCase(key),
      amount: Math.round(-last.amount * 100) / 100,
      rhythm,
      categoryId: categorize(last, data.categoryRules),
      firstMonth: monthOf(sorted[0].date),
      count: sorted.length,
    });
  }
  return suggestions.sort((a, b) => b.amount - a.amount);
}

/** Providers that offer comparable services; two active contracts in a group are a saving hint. */
export const SIMILAR_SERVICES: readonly { label: string; keywords: string[] }[] = [
  {
    label: 'Streaming',
    keywords: [
      'netflix',
      'disney',
      'prime video',
      'amazon prime',
      'wow',
      'sky',
      'dazn',
      'paramount',
      'apple tv',
      'rtl+',
      'joyn',
      'streaming',
    ],
  },
  {
    label: 'Musik',
    keywords: ['spotify', 'apple music', 'deezer', 'tidal', 'amazon music', 'youtube music'],
  },
  {
    label: 'Cloud-Speicher',
    keywords: ['icloud', 'google one', 'dropbox', 'onedrive', 'microsoft 365'],
  },
  { label: 'Fitness', keywords: ['fitness', 'mcfit', 'urban sports', 'gym'] },
];

export interface DuplicateGroup {
  label: string;
  items: RecurringItem[];
  /** Monthly saving when keeping only the cheapest one. */
  monthlySaving: number;
}

export function duplicateSubscriptions(data: FinanceData, month: Month): DuplicateGroup[] {
  const active = data.recurring.filter(
    (item) => item.kind === 'expense' && isActiveIn(item, month) && item.status === 'active',
  );
  return SIMILAR_SERVICES.flatMap((service) => {
    const items = active.filter((item) =>
      service.keywords.some((keyword) =>
        `${item.name} ${item.provider}`.toLowerCase().includes(keyword),
      ),
    );
    if (items.length < 2) return [];
    const monthly = items.map(monthlyEquivalent).sort((a, b) => a - b);
    const monthlySaving = monthly.slice(1).reduce((a, b) => a + b, 0);
    return [{ label: service.label, items, monthlySaving }];
  });
}

/** Contracts whose cancellation deadline is within `days` from today. */
export function upcomingDeadlines(data: FinanceData, today: IsoDate, days = 30): RecurringItem[] {
  const limit = addDays(today, days);
  return data.recurring
    .filter(
      (item) =>
        item.kind === 'expense' &&
        item.status === 'active' &&
        item.cancelBy &&
        item.cancelBy >= today &&
        item.cancelBy <= limit &&
        isCurrentOrFuture(item, monthOf(today)),
    )
    .sort((a, b) => a.cancelBy.localeCompare(b.cancelBy));
}

export type HintKind = 'saving' | 'warning' | 'reminder';

export interface Hint {
  id: string;
  kind: HintKind;
  title: string;
  text: string;
  link: string;
}

/**
 * Savings hints: duplicate subscriptions, rising categories, unusually high bookings,
 * exceeded budgets and upcoming cancellation deadlines.
 */
export function savingsHints(data: FinanceData, month: Month, today: IsoDate): Hint[] {
  const hints: Hint[] = [];

  for (const group of duplicateSubscriptions(data, month)) {
    hints.push({
      id: `dup-${group.label}`,
      kind: 'saving',
      title: `Sparpotenzial: bis zu ${group.monthlySaving.toFixed(2).replace('.', ',')} € / Monat`,
      text: `${group.items.length} ${group.label}-Verträge mit ähnlichem Angebot: ${group.items.map((i) => i.name).join(', ')}`,
      link: '/vertraege',
    });
  }

  for (const item of upcomingDeadlines(data, today)) {
    hints.push({
      id: `deadline-${item.id}`,
      kind: 'reminder',
      title: `Kündigungsfrist: ${item.name}`,
      text: `Noch ${daysBetween(today, item.cancelBy)} Tage, um zu kündigen.`,
      link: '/vertraege',
    });
  }

  const spending = spendingByCategory(data, month);
  for (const budget of data.budgets) {
    const spent = spending.find((entry) => entry.categoryId === budget.categoryId)?.amount ?? 0;
    if (budget.limit > 0 && spent > budget.limit) {
      hints.push({
        id: `budget-${budget.categoryId}`,
        kind: 'warning',
        title: `Budget überschritten: ${categoryName(budget.categoryId)}`,
        text: `${Math.round(spent)} € von ${Math.round(budget.limit)} € ausgegeben.`,
        link: '/budgets',
      });
    }
  }

  // Rising categories: last full month against the three months before.
  const lastMonth = addMonths(month, -1);
  const previous = [2, 3, 4].map((offset) => spendingByCategory(data, addMonths(month, -offset)));
  if (previous.some((list) => list.length)) {
    for (const entry of spendingByCategory(data, lastMonth)) {
      const average =
        previous.reduce(
          (sum, list) => sum + (list.find((e) => e.categoryId === entry.categoryId)?.amount ?? 0),
          0,
        ) / 3;
      if (average > 0 && entry.amount > average * 1.25 && entry.amount - average > 50) {
        hints.push({
          id: `rise-${entry.categoryId}`,
          kind: 'warning',
          title: `${categoryName(entry.categoryId)} steigt`,
          text: `Im Vormonat ${Math.round(entry.amount)} €, sonst im Schnitt ${Math.round(average)} €.`,
          link: '/auswertung',
        });
      }
    }
  }

  // Unusually high single bookings in the last 30 days.
  const since = addDays(today, -30);
  for (const tx of data.transactions.filter(
    (t) => t.date >= since && t.date <= today && isSpending(t),
  )) {
    const sameCategory = data.transactions.filter(
      (t) => t.categoryId === tx.categoryId && isSpending(t) && t.id !== tx.id,
    );
    if (sameCategory.length < 5) continue;
    const typical = median(sameCategory.map((t) => -t.amount));
    if (-tx.amount > typical * 3 && -tx.amount > 100) {
      hints.push({
        id: `high-${tx.id}`,
        kind: 'warning',
        title: `Ungewöhnlich hohe Ausgabe`,
        text: `${tx.counterparty || categoryName(tx.categoryId)}: ${Math.round(-tx.amount)} € (üblich ca. ${Math.round(typical)} €).`,
        link: '/buchungen',
      });
    }
  }

  return hints;
}

export function savingsPotentialPerMonth(data: FinanceData, month: Month): number {
  return duplicateSubscriptions(data, month).reduce((sum, group) => sum + group.monthlySaving, 0);
}

/** Bookings of the month that still sit in the fallback category. */
export function uncategorizedCount(data: FinanceData, month: Month): number {
  return transactionsIn(data, month).filter((tx) => tx.categoryId === 'sonstiges').length;
}

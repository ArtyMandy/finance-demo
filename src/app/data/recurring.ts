import type { Month, RecurringItem, Rhythm } from './models';
import { monthIndex } from './months';

const RHYTHM_MONTHS: Record<Exclude<Rhythm, 'once'>, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

/** True when the item is valid in the month (between `from` and `to`). */
export function isActiveIn(item: RecurringItem, month: Month): boolean {
  return item.from <= month && (!item.to || item.to >= month);
}

/** Amount the item books in a given month (0 when it does not fall due). */
export function amountInMonth(item: RecurringItem, month: Month): number {
  if (!isActiveIn(item, month)) return 0;
  if (item.rhythm === 'once') return item.from === month ? item.amount : 0;
  const offset = monthIndex(month) - monthIndex(item.from);
  return offset % RHYTHM_MONTHS[item.rhythm] === 0 ? item.amount : 0;
}

/** Average amount per month, e.g. a yearly 120 € insurance is 10 € per month. One-off items count 0. */
export function monthlyEquivalent(item: RecurringItem): number {
  return item.rhythm === 'once' ? 0 : item.amount / RHYTHM_MONTHS[item.rhythm];
}

/** Items that still matter: valid this month or starting later. */
export function isCurrentOrFuture(item: RecurringItem, month: Month): boolean {
  return !item.to || item.to >= month;
}

/** Sum of a kind (income or expense) booked in a month. */
export function plannedTotal(
  items: readonly RecurringItem[],
  kind: RecurringItem['kind'],
  month: Month,
): number {
  return items
    .filter((item) => item.kind === kind)
    .reduce((sum, item) => sum + amountInMonth(item, month), 0);
}

/** Monthly fixed costs: all current recurring expenses as a monthly average. */
export function fixedCostsPerMonth(items: readonly RecurringItem[], month: Month): number {
  return items
    .filter((item) => item.kind === 'expense' && isActiveIn(item, month))
    .reduce((sum, item) => sum + monthlyEquivalent(item), 0);
}

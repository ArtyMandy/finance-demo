import type { IsoDate, Month } from './models';

/** Every month from `from` to `to` (both `YYYY-MM`, inclusive). Empty when `from` is after `to`. */
export function monthsBetween(from: Month, to: Month): Month[] {
  const months: Month[] = [];
  for (let index = monthIndex(from); index <= monthIndex(to); index++)
    months.push(monthFromIndex(index));
  return months;
}

/** Months since year 0, so differences are easy. */
export function monthIndex(month: Month): number {
  const [year, m] = month.split('-').map(Number);
  return year * 12 + m - 1;
}

export function monthFromIndex(index: number): Month {
  const year = Math.floor(index / 12);
  return `${year}-${String((index % 12) + 1).padStart(2, '0')}`;
}

export function addMonths(month: Month, count: number): Month {
  return monthFromIndex(monthIndex(month) + count);
}

export function monthOf(date: IsoDate): Month {
  return date.slice(0, 7);
}

export function daysInMonth(month: Month): number {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

export function lastDayOf(month: Month): IsoDate {
  return `${month}-${String(daysInMonth(month)).padStart(2, '0')}`;
}

/** Whole days from `a` to `b` (both `YYYY-MM-DD`). */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/** The last `count` months ending with `month`, oldest first. */
export function lastMonths(month: Month, count: number): Month[] {
  return monthsBetween(addMonths(month, -(count - 1)), month);
}

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
export const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

import type { IsoDate, Month } from '../data/models';

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const euroRounded = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const percent = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 });
const precisePercent = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  maximumFractionDigits: 3,
});
const signedPercent = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const monthLong = new Intl.DateTimeFormat('de-DE', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthShort = new Intl.DateTimeFormat('de-DE', { month: 'short', timeZone: 'UTC' });
const monthShortYear = new Intl.DateTimeFormat('de-DE', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const dateLong = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const dateShort = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

/** 1.234,56 € */
export const formatEuro = (value: number) => euro.format(value);
/** 1.235 € */
export const formatEuroRounded = (value: number) => euroRounded.format(value);
/** 0.24 → 24 % */
export const formatPercent = (value: number) => percent.format(value);
/** 0.26375 → 26,375 % (for legal rates) */
export const formatPercentPrecise = (value: number) => precisePercent.format(value);
/** 0.024 → +2,4 % */
export const formatSignedPercent = (value: number) => signedPercent.format(value);

function monthDate(month: Month): number {
  const [year, m] = month.split('-').map(Number);
  return Date.UTC(year, m - 1, 1);
}

/** 2026-10 → Oktober 2026 */
export const formatMonth = (month: Month) => (month ? monthLong.format(monthDate(month)) : '');
/** 2026-10 → Okt. */
export const formatMonthShort = (month: Month) => monthShort.format(monthDate(month));
/** 2026-10 → Okt. 2026 */
export const formatMonthShortYear = (month: Month) => monthShortYear.format(monthDate(month));
/** 2026-10-18 → 18. Oktober 2026 */
export const formatDate = (date: IsoDate) =>
  date ? dateLong.format(Date.parse(`${date}T00:00:00Z`)) : '';
/** 2026-10-18 → 18.10.2026 */
export const formatDateShort = (date: IsoDate) =>
  date ? dateShort.format(Date.parse(`${date}T00:00:00Z`)) : '';

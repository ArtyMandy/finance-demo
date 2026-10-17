/** Every month from `from` to `to` (both `YYYY-MM`, inclusive). Empty when `from` is after `to`. */
export function monthsBetween(from: string, to: string): string[] {
  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);
  const months: string[] = [];
  for (let index = fromYear * 12 + fromMonth - 1; index <= toYear * 12 + toMonth - 1; index++) {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    months.push(`${year}-${String(month).padStart(2, '0')}`);
  }
  return months;
}

import { monthsBetween } from './month-range';

describe('monthsBetween', () => {
  it('should return a single month when from and to are equal', () => {
    expect(monthsBetween('2026-10', '2026-10')).toEqual(['2026-10']);
  });

  it('should cross the year boundary', () => {
    expect(monthsBetween('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
  });

  it('should return twelve months for a full year', () => {
    expect(monthsBetween('2026-01', '2026-12')).toHaveLength(12);
  });

  it('should return nothing when from is after to', () => {
    expect(monthsBetween('2026-05', '2026-04')).toEqual([]);
  });
});

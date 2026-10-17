import { niceCeil } from './income-chart';

describe('niceCeil', () => {
  it('should fall back to 1000 when there is no income', () => {
    expect(niceCeil(0)).toBe(1000);
  });

  it('should round up to the next nice axis maximum', () => {
    expect(niceCeil(1000)).toBe(1000);
    expect(niceCeil(1800)).toBe(2000);
    expect(niceCeil(2800)).toBe(3000);
    expect(niceCeil(3200)).toBe(4000);
    expect(niceCeil(7300)).toBe(8000);
    expect(niceCeil(9100)).toBe(10000);
  });
});

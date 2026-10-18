import {
  altersvorsorgeGrant,
  arbeitnehmerSparzulage,
  capitalGainsTax,
  distributeExemption,
  savingsPlanValue,
  sparerPauschbetrag,
  vorabpauschale,
  wohnungsbaupraemie,
} from './rules';

describe('altersvorsorgeGrant', () => {
  it('gives no grant below the minimum contribution of 120 €', () => {
    expect(altersvorsorgeGrant(119).total).toBe(0);
    expect(altersvorsorgeGrant(119).eligible).toBe(false);
  });

  it('pays 50 % on the first 360 €', () => {
    expect(altersvorsorgeGrant(360).basic).toBe(180);
  });

  it('pays 25 % from 360 € to 1.800 €, at most 540 €', () => {
    expect(altersvorsorgeGrant(1000).basic).toBe(180 + 160);
    expect(altersvorsorgeGrant(1800).basic).toBe(540);
    expect(altersvorsorgeGrant(6000).basic).toBe(540);
  });

  it('adds up to 300 € per child and the starter bonus', () => {
    const grant = altersvorsorgeGrant(1800, 2, true);
    expect(grant.children).toBe(600);
    expect(grant.starterBonus).toBe(200);
    expect(grant.total).toBe(1340);
  });

  it('caps the child grant at the own contribution', () => {
    expect(altersvorsorgeGrant(200, 1).children).toBe(200);
  });
});

describe('capitalGainsTax', () => {
  it('is zero while income stays within the exemption', () => {
    expect(capitalGainsTax(800, { exemption: 1000, churchTax: 0 }).tax).toBe(0);
  });

  it('taxes the part above the exemption at 26.375 %', () => {
    expect(capitalGainsTax(2000, { exemption: 1000, churchTax: 0 }).tax).toBe(263.75);
  });

  it('applies the 30 % partial exemption for equity funds', () => {
    const result = capitalGainsTax(2000, { fundType: 'equity', exemption: 1000, churchTax: 0 });
    expect(result.taxableIncome).toBe(1400);
    expect(result.tax).toBe(105.5);
  });

  it('uses a higher rate with church tax', () => {
    expect(capitalGainsTax(1000, { exemption: 0, churchTax: 9 }).tax).toBe(279.9);
  });
});

describe('sparerPauschbetrag', () => {
  it('is 1.000 € single and 2.000 € joint', () => {
    expect(sparerPauschbetrag(false)).toBe(1000);
    expect(sparerPauschbetrag(true)).toBe(2000);
  });
});

describe('vorabpauschale', () => {
  it('is start value × 2.29 % × 0.7', () => {
    expect(vorabpauschale(10000, 11000)).toBe(160.3);
  });

  it('is capped at the actual gain', () => {
    expect(vorabpauschale(10000, 10100)).toBe(100);
    expect(vorabpauschale(10000, 9000)).toBe(0);
  });

  it('is reduced by distributions', () => {
    expect(vorabpauschale(10000, 11000, 60)).toBe(100.3);
  });
});

describe('wohnungsbaupraemie', () => {
  it('pays 10 % of up to 700 € for singles', () => {
    expect(wohnungsbaupraemie(1000, 30000, false)).toBe(70);
    expect(wohnungsbaupraemie(500, 30000, false)).toBe(50);
  });

  it('needs at least 50 € and income within the limit', () => {
    expect(wohnungsbaupraemie(40, 30000, false)).toBe(0);
    expect(wohnungsbaupraemie(700, 35001, false)).toBe(0);
    expect(wohnungsbaupraemie(1400, 60000, true)).toBe(140);
  });
});

describe('arbeitnehmerSparzulage', () => {
  it('pays 20 % on funds and 9 % on building savings, at most 122.30 €', () => {
    expect(arbeitnehmerSparzulage(400, 470, 30000, false)).toBe(122.3);
    expect(arbeitnehmerSparzulage(1000, 0, 30000, false)).toBe(80);
  });

  it('is zero above the income limit', () => {
    expect(arbeitnehmerSparzulage(400, 0, 40001, false)).toBe(0);
    expect(arbeitnehmerSparzulage(400, 0, 70000, true)).toBe(80);
  });
});

describe('savingsPlanValue', () => {
  it('matches the design formula rate × ((1 + i)^n − 1) / i', () => {
    const i = 0.06 / 12;
    const n = 240;
    expect(savingsPlanValue(250, 20, 0.06)).toBeCloseTo((250 * ((1 + i) ** n - 1)) / i, 1);
  });

  it('handles a return of 0 %', () => {
    expect(savingsPlanValue(100, 10, 0)).toBe(12000);
  });
});

describe('distributeExemption', () => {
  it('splits the allowance proportionally when expected income exceeds it', () => {
    expect(distributeExemption([500, 1500], 1000)).toEqual([250, 750]);
  });

  it('never exceeds the allowance', () => {
    const result = distributeExemption([333, 333, 334], 1000);
    expect(result.reduce((a, b) => a + b, 0)).toBe(1000);
  });

  it('gives the rest to the largest bank when everything fits', () => {
    expect(distributeExemption([180, 520], 1000)).toEqual([180, 820]);
  });
});

import { TestBed } from '@angular/core/testing';
import { Connectivity } from './connectivity';

describe('Connectivity', () => {
  let onLine: boolean;

  beforeEach(() => {
    onLine = true;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => onLine);
  });

  afterEach(() => vi.restoreAllMocks());

  it('should start with the current browser state', () => {
    onLine = false;
    expect(TestBed.inject(Connectivity).online()).toBe(false);
  });

  it('should follow online and offline events', () => {
    const connectivity = TestBed.inject(Connectivity);
    expect(connectivity.online()).toBe(true);

    onLine = false;
    window.dispatchEvent(new Event('offline'));
    expect(connectivity.online()).toBe(false);

    onLine = true;
    window.dispatchEvent(new Event('online'));
    expect(connectivity.online()).toBe(true);
  });
});

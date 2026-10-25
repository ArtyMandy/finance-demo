import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  it('starts green without a saved choice', () => {
    expect(TestBed.inject(ThemeService).theme()).toBe('gruen');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('switches to pink, remembers it and switches back', () => {
    const theme = TestBed.inject(ThemeService);
    theme.set('rosa');
    expect(document.documentElement.getAttribute('data-theme')).toBe('rosa');
    expect(localStorage.getItem('finanz-demo:theme')).toBe('rosa');

    theme.set('gruen');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('applies the saved theme on start', () => {
    localStorage.setItem('finanz-demo:theme', 'rosa');
    expect(TestBed.inject(ThemeService).theme()).toBe('rosa');
    expect(document.documentElement.getAttribute('data-theme')).toBe('rosa');
  });
});

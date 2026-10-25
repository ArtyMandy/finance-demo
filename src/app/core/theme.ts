import { DOCUMENT, inject, Service, signal } from '@angular/core';

export type Theme = 'gruen' | 'rosa';

const STORAGE_KEY = 'finanz-demo:theme';

/** Browser bar colour per theme; matches --color-primary in styles.css. */
const THEME_COLORS: Record<Theme, string> = { gruen: '#0f766e', rosa: '#be185d' };

/** Colour theme of the app, remembered per device. */
@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = this.document.defaultView?.localStorage;
  private readonly themeState = signal<Theme>(this.read() === 'rosa' ? 'rosa' : 'gruen');

  readonly theme = this.themeState.asReadonly();

  constructor() {
    this.apply(this.themeState());
  }

  set(theme: Theme): void {
    this.themeState.set(theme);
    this.apply(theme);
    try {
      this.storage?.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage blocked (private mode); the theme still applies for this session.
    }
  }

  private read(): string | null {
    try {
      return this.storage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  private apply(theme: Theme): void {
    const root = this.document.documentElement;
    if (theme === 'gruen') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    this.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[theme]);
  }
}

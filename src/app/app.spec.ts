import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideServiceWorker } from '@angular/service-worker';
import { filter, firstValueFrom } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { AppInstall, BeforeInstallPromptEvent } from './core/app-install';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideServiceWorker('ngsw-worker.js', { enabled: false }),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the overview with onboarding at the root route', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Deine Finanzen',
    );
    expect(harness.routeNativeElement?.textContent).toContain('Beispieldaten laden');
  });

  it('should show the four main areas in the navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll(
        'app-main-nav.bottom-nav nav a',
      ) as NodeListOf<HTMLAnchorElement>,
    ).map((link) => link.textContent?.trim());
    expect(labels).toEqual(['Übersicht', 'Ziele', 'Verträge', 'Anlage']);
  });

  it('should show sign-in and sign-up links in the header', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const links = Array.from(
      fixture.nativeElement.querySelectorAll(
        'app-site-header nav[aria-label="Konto"] a',
      ) as NodeListOf<HTMLAnchorElement>,
    ).map((link) => [link.textContent?.trim(), link.getAttribute('href')]);
    expect(links).toEqual([
      ['Anmelden', '/anmelden'],
      ['Registrieren', '/anmelden?modus=registrieren'],
    ]);
  });

  it('should keep the install button in the header once the browser allows installing', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-site-header .install')).toBeNull();

    TestBed.inject(AppInstall);
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
        prompt: vi.fn(async () => undefined),
        userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
      }) satisfies BeforeInstallPromptEvent,
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-site-header .install')?.textContent).toContain(
      'App installieren',
    );
  });

  it('should open the login page in sign-up mode via the Registrieren link', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/anmelden');
    await fixture.whenStable();

    const navigated = firstValueFrom(
      TestBed.inject(Router).events.pipe(filter((event) => event instanceof NavigationEnd)),
    );
    fixture.nativeElement
      .querySelector('app-site-header nav[aria-label="Konto"] a.btn-secondary')
      .click();
    await navigated;
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-login h1')?.textContent).toContain(
      'Registrieren',
    );
  });
});

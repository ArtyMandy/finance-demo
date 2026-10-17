import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideServiceWorker } from '@angular/service-worker';
import { filter, firstValueFrom } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
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

  it('should render the home page at the root route', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Übersicht');
  });

  it('should show the header with overview, sign-in and sign-up links on every page', async () => {
    const fixture = TestBed.createComponent(App);
    for (const url of ['/', '/anmelden']) {
      await TestBed.inject(Router).navigateByUrl(url);
      await fixture.whenStable();

      const links = Array.from(
        fixture.nativeElement.querySelectorAll('app-site-header nav a') as NodeListOf<HTMLAnchorElement>,
      ).map((link) => [link.textContent?.trim(), link.getAttribute('href')]);
      expect(links).toEqual([
        ['Übersicht', '/'],
        ['Anmelden', '/anmelden'],
        ['Registrieren', '/anmelden?modus=registrieren'],
      ]);
    }
  });

  it('should open the login page in sign-up mode via the Registrieren link', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/anmelden');
    await fixture.whenStable();

    const navigated = firstValueFrom(
      TestBed.inject(Router).events.pipe(filter((event) => event instanceof NavigationEnd)),
    );
    fixture.nativeElement.querySelector('app-site-header a.button-secondary').click();
    await navigated;
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-login h1')?.textContent).toContain('Registrieren');
  });
});

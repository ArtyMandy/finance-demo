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
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Finance-Demo');
  });

  it('should show sign-in and sign-up links in the header', async () => {
    const harness = await RouterTestingHarness.create('/');
    const links = Array.from(
      harness.routeNativeElement?.querySelectorAll<HTMLAnchorElement>('nav a.button') ?? [],
    ).map((link) => [link.textContent?.trim(), link.getAttribute('href')]);
    expect(links).toEqual([
      ['Anmelden', '/anmelden'],
      ['Registrieren', '/anmelden?modus=registrieren'],
    ]);
  });

  it('should open the login page in sign-up mode via the Registrieren link', async () => {
    const harness = await RouterTestingHarness.create('/');
    const link = harness.routeNativeElement?.querySelector<HTMLAnchorElement>('a.button-secondary');

    const navigated = firstValueFrom(
      TestBed.inject(Router).events.pipe(filter((event) => event instanceof NavigationEnd)),
    );
    link?.click();
    await navigated;
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Registrieren');
  });
});

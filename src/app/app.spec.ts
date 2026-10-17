import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { JOKE_API_URL } from './overview/joke-card';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
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

  it('should navigate to the overview page', async () => {
    const harness = await RouterTestingHarness.create('/');
    const link = harness.routeNativeElement?.querySelector<HTMLAnchorElement>('a.button');
    expect(link?.getAttribute('href')).toBe('/uebersicht');

    const navigated = firstValueFrom(
      TestBed.inject(Router).events.pipe(filter((event) => event instanceof NavigationEnd)),
    );
    link?.click();
    await navigated;
    harness.detectChanges();

    TestBed.inject(HttpTestingController)
      .expectOne(JOKE_API_URL)
      .flush({ id: '1', value: 'Chuck Norris tested this.' });
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Übersicht');
  });
});

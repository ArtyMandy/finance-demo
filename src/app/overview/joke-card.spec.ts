import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { JOKE_API_URL, JokeCard } from './joke-card';

describe('JokeCard', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [JokeCard],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should show the joke returned by the API', async () => {
    const fixture = TestBed.createComponent(JokeCard);
    TestBed.tick();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Witz wird geladen');

    httpTesting.expectOne(JOKE_API_URL).flush({ id: '1', value: 'Chuck Norris tested this.' });
    await fixture.whenStable();

    expect(element.querySelector('blockquote')?.textContent).toContain('Chuck Norris tested this.');
  });

  it('should show an error message when the request fails', async () => {
    const fixture = TestBed.createComponent(JokeCard);
    TestBed.tick();

    httpTesting.expectOne(JOKE_API_URL).flush('', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('konnte nicht geladen werden');
  });

  it('should fetch a new joke when the button is clicked', async () => {
    const fixture = TestBed.createComponent(JokeCard);
    TestBed.tick();
    httpTesting.expectOne(JOKE_API_URL).flush({ id: '1', value: 'First joke' });
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
    TestBed.tick();
    httpTesting.expectOne(JOKE_API_URL).flush({ id: '2', value: 'Second joke' });
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('blockquote')?.textContent).toContain('Second joke');
  });
});

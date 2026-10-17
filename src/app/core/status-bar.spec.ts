import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppUpdates } from './app-updates';
import { Connectivity } from './connectivity';
import { StatusBar } from './status-bar';

describe('StatusBar', () => {
  const online = signal(true);
  const updateReady = signal(false);
  const reload = vi.fn();

  beforeEach(() => {
    online.set(true);
    updateReady.set(false);
    reload.mockClear();
    TestBed.configureTestingModule({
      imports: [StatusBar],
      providers: [
        { provide: Connectivity, useValue: { online } },
        { provide: AppUpdates, useValue: { updateReady, reload } },
      ],
    });
  });

  it('should render nothing while online and up to date', async () => {
    const fixture = TestBed.createComponent(StatusBar);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.banner')).toBeNull();
  });

  it('should announce when the browser goes offline', async () => {
    const fixture = TestBed.createComponent(StatusBar);
    await fixture.whenStable();

    online.set(false);
    await fixture.whenStable();

    const status = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');
    expect(status?.textContent).toContain('Du bist offline');
  });

  it('should offer a reload when a new version is ready', async () => {
    updateReady.set(true);
    const fixture = TestBed.createComponent(StatusBar);
    await fixture.whenStable();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button?.textContent).toContain('Neu laden');
    button?.click();

    expect(reload).toHaveBeenCalled();
  });
});

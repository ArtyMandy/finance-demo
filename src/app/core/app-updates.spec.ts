import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { AppUpdates } from './app-updates';

describe('AppUpdates', () => {
  let versionUpdates: Subject<VersionEvent>;
  let unrecoverable: Subject<{ type: 'UNRECOVERABLE_STATE'; reason: string }>;

  function setup(isEnabled = true): AppUpdates {
    versionUpdates = new Subject();
    unrecoverable = new Subject();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SwUpdate,
          useValue: {
            isEnabled,
            versionUpdates,
            unrecoverable,
            checkForUpdate: vi.fn().mockResolvedValue(false),
          },
        },
      ],
    });
    return TestBed.inject(AppUpdates);
  }

  it('should report a ready update', () => {
    const updates = setup();
    expect(updates.updateReady()).toBe(false);

    versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'b' } });
    expect(updates.updateReady()).toBe(false);

    versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    });
    expect(updates.updateReady()).toBe(true);
  });

  it('should reload when the service worker is in an unrecoverable state', () => {
    const updates = setup();
    const reload = vi.spyOn(updates, 'reload').mockImplementation(() => undefined);

    unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'cache gone' });

    expect(reload).toHaveBeenCalled();
  });

  it('should ignore events while the service worker is disabled', () => {
    const updates = setup(false);

    versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    });

    expect(updates.updateReady()).toBe(false);
  });
});

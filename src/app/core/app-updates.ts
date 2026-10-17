import { ApplicationRef, DOCUMENT, inject, Service, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { filter, interval } from 'rxjs';

export const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Notices new app versions installed by the service worker. */
@Service()
export class AppUpdates {
  private readonly swUpdate = inject(SwUpdate);
  private readonly document = inject(DOCUMENT);
  private readonly readySignal = signal(false);

  /** True once a new version has been downloaded and a reload would activate it. */
  readonly updateReady = this.readySignal.asReadonly();

  constructor() {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(
        filter((event) => event.type === 'VERSION_READY'),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.readySignal.set(true));

    // The cached version can no longer be served, so the only way out is a fresh load
    this.swUpdate.unrecoverable.pipe(takeUntilDestroyed()).subscribe(() => this.reload());

    // Start polling only once stable, otherwise the interval keeps the app from ever becoming stable
    const checks = interval(UPDATE_CHECK_INTERVAL_MS).pipe(takeUntilDestroyed());
    inject(ApplicationRef)
      .whenStable()
      .then(() => checks.subscribe(() => this.swUpdate.checkForUpdate().catch(() => undefined)));
  }

  reload(): void {
    this.document.location.reload();
  }
}

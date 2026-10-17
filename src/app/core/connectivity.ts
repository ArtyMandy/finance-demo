import { DestroyRef, DOCUMENT, inject, Service, signal } from '@angular/core';

/** Tracks whether the browser currently has a network connection. */
@Service()
export class Connectivity {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly onlineSignal = signal(this.window?.navigator.onLine ?? true);

  readonly online = this.onlineSignal.asReadonly();

  constructor() {
    const update = () => this.onlineSignal.set(this.window?.navigator.onLine ?? true);
    this.window?.addEventListener('online', update);
    this.window?.addEventListener('offline', update);
    inject(DestroyRef).onDestroy(() => {
      this.window?.removeEventListener('online', update);
      this.window?.removeEventListener('offline', update);
    });
  }
}

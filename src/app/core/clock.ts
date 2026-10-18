import { computed, DestroyRef, DOCUMENT, inject, Service, signal } from '@angular/core';
import type { IsoDate } from '../data/models';
import { monthOf } from '../data/months';

function localToday(): IsoDate {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Today's date as a signal, refreshed when the app comes back to the foreground. */
@Service()
export class Clock {
  readonly today = signal<IsoDate>(localToday());
  readonly month = computed(() => monthOf(this.today()));
  readonly year = computed(() => Number(this.today().slice(0, 4)));

  constructor() {
    const document = inject(DOCUMENT);
    const refresh = () => {
      if (document.visibilityState === 'visible') this.today.set(localToday());
    };
    document.addEventListener('visibilitychange', refresh);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('visibilitychange', refresh));
  }
}

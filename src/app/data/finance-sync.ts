import { computed, DestroyRef, effect, inject, Service, signal, untracked } from '@angular/core';
import { Auth } from '../core/auth';
import { Connectivity } from '../core/connectivity';
import { Supabase } from '../core/supabase';
import { FinanceStore, normalizeData } from './finance-store';

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error' | 'unavailable';

const SAVE_DELAY_MS = 1500;

/**
 * Mirrors the local data to Supabase while signed in. Last write wins: on sign-in the newer
 * copy (local or cloud) is kept; afterwards every change is uploaded shortly after.
 */
@Service()
export class FinanceSync {
  private readonly supabase = inject(Supabase).client;
  private readonly auth = inject(Auth);
  private readonly store = inject(FinanceStore);
  private readonly connectivity = inject(Connectivity);

  private readonly state = signal<SyncStatus>('off');
  readonly status = computed(() => (this.auth.user() ? this.state() : 'off'));

  private userId: string | undefined;
  private pulling = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      const user = this.auth.user();
      const online = this.connectivity.online();
      untracked(() => {
        if (!user) {
          this.userId = undefined;
          return;
        }
        if (online && (user.id !== this.userId || this.state() === 'error')) {
          this.userId = user.id;
          void this.pull();
        }
      });
    });

    effect(() => {
      this.store.data();
      untracked(() => {
        if (!this.userId || this.pulling || this.state() === 'unavailable') return;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => void this.push(), SAVE_DELAY_MS);
      });
    });

    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  private async pull(): Promise<void> {
    this.pulling = true;
    this.state.set('syncing');
    try {
      const { data, error } = await this.supabase
        .from('finance_documents')
        .select('data, updated_at')
        .maybeSingle();
      if (error) throw error;
      const local = this.store.data();
      if (data && Date.parse(data.updated_at) > Date.parse(local.updatedAt)) {
        this.store.replace({ ...normalizeData(data.data), updatedAt: data.updated_at });
        this.state.set('synced');
      } else {
        await this.push();
      }
    } catch (error) {
      this.fail(error);
    } finally {
      this.pulling = false;
    }
  }

  private async push(): Promise<void> {
    if (!this.userId || !this.connectivity.online()) return;
    this.state.set('syncing');
    const data = this.store.data();
    const { error } = await this.supabase
      .from('finance_documents')
      .upsert({ user_id: this.userId, data, updated_at: data.updatedAt });
    if (error) this.fail(error);
    else this.state.set('synced');
  }

  private fail(error: unknown): void {
    const code = (error as { code?: string } | undefined)?.code;
    // Table not created yet (migration not applied): keep working locally.
    this.state.set(code === '42P01' || code === 'PGRST205' ? 'unavailable' : 'error');
  }
}

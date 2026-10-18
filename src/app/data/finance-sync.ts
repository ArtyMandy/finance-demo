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
 *
 * Local data is bound to the account it belongs to: it is never uploaded into another
 * account, and it is removed from the device once the user is signed out.
 */
@Service()
export class FinanceSync {
  private readonly supabase = inject(Supabase).client;
  private readonly auth = inject(Auth);
  private readonly store = inject(FinanceStore);
  private readonly connectivity = inject(Connectivity);

  private readonly state = signal<SyncStatus>('off');
  private readonly authReady = signal(false);
  readonly status = computed(() => (this.auth.user() ? this.state() : 'off'));

  private userId: string | undefined;
  /** True until the cloud copy of the current user has been loaded. */
  private needsPull = false;
  private pulling = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    void this.auth.ready.then(() => this.authReady.set(true));

    effect(() => {
      const user = this.auth.user();
      const ready = this.authReady();
      const online = this.connectivity.online();
      untracked(() => {
        // Before the stored session is restored, "no user" does not mean signed out.
        if (!ready) return;
        if (!user) {
          this.onSignedOut();
          return;
        }
        if (user.id !== this.userId) {
          // Data left by another account must never end up in this one.
          if (this.store.owner() && this.store.owner() !== user.id) this.store.clearLocal();
          this.userId = user.id;
          this.store.setOwner(user.id);
          this.needsPull = true;
        }
        if (online && (this.needsPull || this.state() === 'error')) void this.pull();
      });
    });

    effect(() => {
      this.store.data();
      untracked(() => {
        if (!this.userId || this.needsPull || this.pulling || this.state() === 'unavailable')
          return;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => void this.push(), SAVE_DELAY_MS);
      });
    });

    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  /**
   * Uploads pending changes right away. Returns true when the cloud copy is up to date,
   * false when it could not be saved (offline, error or cloud backup not set up).
   */
  async flush(): Promise<boolean> {
    clearTimeout(this.timer);
    if (!this.userId || this.needsPull || !this.connectivity.online()) return false;
    if (this.state() === 'unavailable') return false;
    return this.push();
  }

  /** Signs out and removes this account's data from the device. */
  async signOut(): Promise<void> {
    clearTimeout(this.timer);
    await this.auth.signOut();
    this.onSignedOut();
  }

  private onSignedOut(): void {
    clearTimeout(this.timer);
    this.userId = undefined;
    this.needsPull = false;
    this.state.set('off');
    // Covers signing out here, in another tab and an expired session.
    if (this.store.owner()) this.store.clearLocal();
  }

  private async pull(): Promise<void> {
    if (this.pulling) return;
    const userId = this.userId;
    this.pulling = true;
    this.state.set('syncing');
    try {
      const { data, error } = await this.supabase
        .from('finance_documents')
        .select('data, updated_at')
        .maybeSingle();
      if (error) throw error;
      // The user may have signed out or switched accounts meanwhile.
      if (userId !== this.userId) return;
      this.needsPull = false;
      const local = this.store.data();
      if (data && Date.parse(data.updated_at) > Date.parse(local.updatedAt)) {
        this.store.replace({ ...normalizeData(data.data), updatedAt: data.updated_at });
        this.state.set('synced');
      } else {
        await this.push();
      }
    } catch (error) {
      if (userId === this.userId) this.fail(error);
    } finally {
      this.pulling = false;
    }
  }

  private async push(): Promise<boolean> {
    const userId = this.userId;
    if (!userId || this.store.owner() !== userId || !this.connectivity.online()) return false;
    this.state.set('syncing');
    const data = this.store.data();
    const { error } = await this.supabase
      .from('finance_documents')
      .upsert({ user_id: userId, data, updated_at: data.updatedAt });
    if (userId !== this.userId) return false;
    if (error) {
      this.fail(error);
      return false;
    }
    this.state.set('synced');
    return true;
  }

  private fail(error: unknown): void {
    const code = (error as { code?: string } | undefined)?.code;
    // Table not created yet (migration not applied): keep working locally.
    this.state.set(code === '42P01' || code === 'PGRST205' ? 'unavailable' : 'error');
  }
}

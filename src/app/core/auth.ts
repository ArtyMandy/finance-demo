import { computed, DOCUMENT, inject, Service, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { Supabase } from './supabase';

@Service()
export class Auth {
  private readonly supabase = inject(Supabase).client;
  private readonly document = inject(DOCUMENT);
  private readonly sessionSignal = signal<Session | undefined>(undefined);

  readonly user = computed(() => this.sessionSignal()?.user);

  /** Resolves once the session stored in the browser has been restored. */
  readonly ready: Promise<void> = this.supabase.auth
    .getSession()
    .then(({ data }) => this.sessionSignal.set(data.session ?? undefined));

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, session) => this.sessionSignal.set(session ?? undefined));
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  /** Returns true when the user still has to confirm their email address. */
  async signUp(email: string, password: string): Promise<boolean> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: this.document.baseURI },
    });
    if (error) throw error;
    return !data.session;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
}

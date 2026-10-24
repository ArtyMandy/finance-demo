import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Auth } from '../core/auth';
import { Supabase } from '../core/supabase';
import { FinanceStore } from './finance-store';
import { FinanceSync } from './finance-sync';
import { emptyFinanceData, FinanceData } from './models';

interface Remote {
  data: FinanceData;
  updated_at: string;
}

/** Minimal stand-in for the Supabase client: one document per signed-in user. */
function fakeSupabase(remote: Map<string, Remote>, currentUser: () => string | undefined) {
  const upserts: { user_id: string; data: FinanceData }[] = [];
  let error: { code: string } | null = null;
  const client = {
    from: () => ({
      select: () => ({
        maybeSingle: async () => ({ data: remote.get(currentUser() ?? '') ?? null, error }),
      }),
      upsert: async (row: { user_id: string; data: FinanceData; updated_at: string }) => {
        if (error) return { error };
        upserts.push(row);
        remote.set(row.user_id, { data: row.data, updated_at: row.updated_at });
        return { error: null };
      },
    }),
  };
  return { client, upserts, fail: (code: string) => (error = { code }) };
}

const settle = async () => {
  for (let i = 0; i < 5; i++) {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }
};

function account(name: string) {
  return {
    id: name,
    name,
    type: 'giro' as const,
    retirement: false,
    linkedLoanId: '',
    institution: '',
    openingBalance: 0,
    valuations: [],
  };
}

describe('FinanceSync', () => {
  let user: ReturnType<typeof signal<{ id: string } | undefined>>;
  let remote: Map<string, Remote>;
  let supabase: ReturnType<typeof fakeSupabase>;
  let signOut: ReturnType<typeof vi.fn>;
  let resolveReady: () => void;

  function setup(): { store: FinanceStore; sync: FinanceSync } {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Auth,
          useValue: {
            user,
            ready: new Promise<void>((resolve) => (resolveReady = resolve)),
            signOut,
          },
        },
        { provide: Supabase, useValue: { client: supabase.client } },
      ],
    });
    const store = TestBed.inject(FinanceStore);
    const sync = TestBed.inject(FinanceSync);
    return { store, sync };
  }

  beforeEach(() => {
    localStorage.clear();
    user = signal<{ id: string } | undefined>(undefined);
    remote = new Map();
    supabase = fakeSupabase(remote, () => user()?.id);
    signOut = vi.fn(async () => user.set(undefined));
  });

  it('removes the data from the device when the user signs out', async () => {
    const { store, sync } = setup();
    resolveReady();
    user.set({ id: 'anna' });
    await settle();
    store.save('accounts', account('Annas Giro'));

    expect(await sync.flush()).toBe(true);
    await sync.signOut();
    await settle();

    expect(store.data().accounts).toEqual([]);
    expect(store.owner()).toBe('');
    expect(localStorage.getItem('finanz-demo:data:v1')).toBeNull();
    expect(remote.get('anna')?.data.accounts.map((a) => a.name)).toEqual(['Annas Giro']);
  });

  it('also clears the data when the session ends elsewhere (other tab, expiry)', async () => {
    const { store } = setup();
    resolveReady();
    user.set({ id: 'anna' });
    await settle();
    store.save('accounts', account('Annas Giro'));

    user.set(undefined);
    await settle();

    expect(store.data().accounts).toEqual([]);
  });

  it('clears data of a previous account on load when nobody is signed in', async () => {
    localStorage.setItem('finanz-demo:owner', 'anna');
    localStorage.setItem(
      'finanz-demo:data:v1',
      JSON.stringify({ ...emptyFinanceData(), accounts: [account('Annas Giro')] }),
    );
    const { store } = setup();
    await settle();
    // The stored session is not restored yet: nothing must happen before that.
    expect(store.data().accounts).toHaveLength(1);

    resolveReady();
    await settle();
    expect(store.data().accounts).toEqual([]);
  });

  it('never uploads data of one account into another', async () => {
    localStorage.setItem('finanz-demo:owner', 'anna');
    localStorage.setItem(
      'finanz-demo:data:v1',
      JSON.stringify({
        ...emptyFinanceData(),
        updatedAt: new Date().toISOString(),
        accounts: [account('Annas Giro')],
      }),
    );
    remote.set('ben', {
      data: { ...emptyFinanceData(), accounts: [account('Bens Giro')] },
      updated_at: '2020-01-01T00:00:00.000Z',
    });
    const { store } = setup();
    resolveReady();
    user.set({ id: 'ben' });
    await settle();

    expect(store.owner()).toBe('ben');
    expect(store.data().accounts.map((a) => a.name)).toEqual(['Bens Giro']);
    expect(supabase.upserts.flatMap((row) => row.data.accounts.map((a) => a.name))).not.toContain(
      'Annas Giro',
    );
  });

  it('takes data entered before signing in into the account', async () => {
    const { store } = setup();
    resolveReady();
    await settle();
    store.save('accounts', account('Ohne Konto erfasst'));

    user.set({ id: 'anna' });
    await settle();

    expect(store.owner()).toBe('anna');
    expect(remote.get('anna')?.data.accounts.map((a) => a.name)).toEqual(['Ohne Konto erfasst']);
  });

  it('reports unsaved data when the cloud backup is not set up', async () => {
    supabase.fail('PGRST205');
    const { store, sync } = setup();
    resolveReady();
    user.set({ id: 'anna' });
    await settle();
    store.save('accounts', account('Annas Giro'));

    expect(sync.status()).toBe('unavailable');
    expect(await sync.flush()).toBe(false);
  });
});

import type { ChurchTax } from '../rules/rules';

/** Month as `YYYY-MM`, date as `YYYY-MM-DD`. Empty string means "not set". */
export type Month = string;
export type IsoDate = string;

export type AccountType = 'giro' | 'kreditkarte' | 'tagesgeld' | 'depot' | 'sachwert' | 'kredit';

/** Cash accounts can hold bookings (to find recurring income and expenses). */
export const CASH_ACCOUNT_TYPES: readonly AccountType[] = ['giro', 'kreditkarte', 'tagesgeld'];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  giro: 'Girokonto',
  kreditkarte: 'Kreditkarte',
  tagesgeld: 'Tagesgeld',
  depot: 'Depot',
  sachwert: 'Sachwert',
  kredit: 'Kredit / Schulden',
};

export interface Valuation {
  date: IsoDate;
  value: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string;
  /** Balance used before the first valuation (older data). */
  openingBalance: number;
  /** Balance or value history entered by the user (loans as positive debt). */
  valuations: Valuation[];
}

/** A booking; only used to find recurring income and expenses, not for statistics or balances. */
export interface Transaction {
  id: string;
  accountId: string;
  date: IsoDate;
  /** Positive = income, negative = expense. */
  amount: number;
  counterparty: string;
  purpose: string;
  categoryId: string;
  /** True once the user picked the category by hand. */
  categoryManual: boolean;
  /** Fingerprint for duplicate detection on CSV import. */
  importKey: string;
}

export type Rhythm = 'once' | 'monthly' | 'quarterly' | 'yearly';

export const RHYTHM_LABELS: Record<Rhythm, string> = {
  once: 'einmalig',
  monthly: 'monatlich',
  quarterly: 'quartalsweise',
  yearly: 'jährlich',
};

export type ContractStatus = 'active' | 'prepared' | 'cancelled';

/** Income source or fixed expense, valid from one month and optionally until another. */
export interface RecurringItem {
  id: string;
  /** Periods of the same income or expense share a series id, so the history stays. */
  seriesId: string;
  kind: 'income' | 'expense';
  name: string;
  amount: number;
  rhythm: Rhythm;
  from: Month;
  /** Empty = open-ended. */
  to: Month;
  categoryId: string;
  /**
   * Own account or depot the money goes to (expenses only, e.g. a savings plan); empty = none.
   * Such expenses count as savings, not as spending.
   */
  targetAccountId: string;
  /** Contract details (expenses only). */
  provider: string;
  customerNumber: string;
  /** Last day to cancel, empty when unknown. */
  cancelBy: IsoDate;
  monthlyCancelable: boolean;
  status: ContractStatus;
}

export interface Budget {
  categoryId: string;
  limit: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  targetMonth: Month;
  saved: number;
  /** Month the goal was reached, empty while active. */
  achievedMonth: Month;
}

export type AssetType = 'etf' | 'aktie' | 'anleihe' | 'fonds' | 'krypto' | 'sonstiges';

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  etf: 'ETF',
  aktie: 'Aktie',
  anleihe: 'Anleihe',
  fonds: 'Fonds',
  krypto: 'Krypto',
  sonstiges: 'Sonstiges',
};

export interface Holding {
  id: string;
  accountId: string;
  name: string;
  isin: string;
  assetType: AssetType;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  /** Monthly savings plan rate, 0 = none. */
  savingsPlan: number;
}

export interface Dividend {
  id: string;
  holdingId: string;
  date: IsoDate;
  amount: number;
}

export interface ExemptionOrder {
  id: string;
  institution: string;
  amount: number;
  /** Expected capital income this year, used to propose a distribution. */
  expectedIncome: number;
}

export type PensionType =
  'gesetzlich' | 'betrieblich' | 'riester' | 'ruerup' | 'altersvorsorgedepot' | 'privat';

export const PENSION_TYPE_LABELS: Record<PensionType, string> = {
  gesetzlich: 'Gesetzliche Rente',
  betrieblich: 'Betriebliche Altersvorsorge',
  riester: 'Riester-Rente',
  ruerup: 'Rürup-Rente (Basisrente)',
  altersvorsorgedepot: 'Altersvorsorgedepot',
  privat: 'Private Vorsorge',
};

export interface PensionEntry {
  id: string;
  type: PensionType;
  name: string;
  /** Expected monthly payout in retirement. */
  expectedMonthly: number;
  /** Own monthly contribution today. */
  monthlyContribution: number;
}

export interface Profile {
  name: string;
  street: string;
  city: string;
  jointAssessment: boolean;
  churchTax: ChurchTax;
  children: number;
}

/** What the net worth on the overview includes besides accounts and depots. */
export interface WealthOptions {
  includeAssets: boolean;
  includeDebts: boolean;
}

/** A learned rule: bookings from this counterparty go to this category. */
export interface CategoryRule {
  pattern: string;
  categoryId: string;
}

export interface FinanceData {
  version: 1;
  /** ISO timestamp of the last change, used for sync. */
  updatedAt: string;
  profile: Profile;
  accounts: Account[];
  transactions: Transaction[];
  recurring: RecurringItem[];
  budgets: Budget[];
  goals: Goal[];
  holdings: Holding[];
  dividends: Dividend[];
  exemptionOrders: ExemptionOrder[];
  pension: PensionEntry[];
  categoryRules: CategoryRule[];
  /** Keys of contract suggestions the user dismissed. */
  dismissedSuggestions: string[];
  wealthOptions: WealthOptions;
}

export function emptyFinanceData(): FinanceData {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    profile: { name: '', street: '', city: '', jointAssessment: false, churchTax: 0, children: 0 },
    accounts: [],
    transactions: [],
    recurring: [],
    budgets: [],
    goals: [],
    holdings: [],
    dividends: [],
    exemptionOrders: [],
    pension: [],
    categoryRules: [],
    dismissedSuggestions: [],
    wealthOptions: { includeAssets: true, includeDebts: true },
  };
}

import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { accountBalance, holdingsValue, isCash, wealthBreakdown } from '../data/analytics';
import { FinanceStore, newId } from '../data/finance-store';
import { Account, ACCOUNT_TYPE_LABELS, AccountType } from '../data/models';
import { formatDate, formatEuro } from '../shared/format';

const CASH_TYPES = new Set<string>(['giro', 'kreditkarte', 'tagesgeld']);

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-accounts',
  templateUrl: './accounts.html',
})
export class Accounts {
  private readonly store = inject(FinanceStore);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('accountDialog');

  protected readonly types = Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][];
  protected readonly typeLabel = (type: AccountType) => ACCOUNT_TYPE_LABELS[type];
  protected readonly eur = formatEuro;
  protected readonly date = formatDate;

  protected readonly wealth = computed(() => wealthBreakdown(this.store.data()));
  protected readonly rows = computed(() => {
    const data = this.store.data();
    return data.accounts.map((account) => ({
      account,
      cash: isCash(account),
      balance: accountBalance(data, account),
      bookings: data.transactions.filter((tx) => tx.accountId === account.id).length,
      fromHoldings: account.type === 'depot' && holdingsValue(data, account.id) !== undefined,
      lastValuation:
        [...account.valuations].sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.date ?? '',
    }));
  });

  protected readonly editing = signal<Account | undefined>(undefined);
  protected readonly confirmDelete = signal(false);

  protected readonly model = signal({
    name: '',
    type: 'giro' as string,
    institution: '',
    amount: 0,
  });
  protected readonly accountForm = form(this.model, (s) => {
    required(s.name, { message: 'Bitte gib einen Namen ein.' });
  });
  protected readonly isCashType = computed(() => CASH_TYPES.has(this.model().type));

  protected open(account?: Account): void {
    this.editing.set(account);
    this.confirmDelete.set(false);
    const data = this.store.data();
    this.accountForm().reset(
      account
        ? {
            name: account.name,
            type: account.type,
            institution: account.institution,
            amount: isCash(account)
              ? account.openingBalance
              : Math.abs(accountBalance(data, account)),
          }
        : { name: '', type: 'giro', institution: '', amount: 0 },
    );
    this.dialog().nativeElement.showModal();
  }

  protected save(): void {
    submit(this.accountForm, async () => {
      const value = this.model();
      const existing = this.editing();
      const type = value.type as AccountType;
      const cash = CASH_TYPES.has(type);
      const account: Account = {
        id: existing?.id ?? newId(),
        name: value.name.trim(),
        type,
        institution: value.institution.trim(),
        openingBalance: cash ? value.amount : 0,
        valuations: existing?.valuations ?? [],
      };
      this.store.save('accounts', account);
      if (!cash) {
        const current = existing ? Math.abs(accountBalance(this.store.data(), account)) : undefined;
        if (current !== value.amount) this.store.setValuation(account.id, Math.abs(value.amount));
      }
      this.dialog().nativeElement.close();
    });
  }

  protected remove(): void {
    const account = this.editing();
    if (account) this.store.removeAccount(account.id);
    this.dialog().nativeElement.close();
  }
}

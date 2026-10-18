import { Component, computed, DOCUMENT, inject, linkedSignal, signal } from '@angular/core';
import { form, FormField, max, min, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Auth } from '../core/auth';
import { Clock } from '../core/clock';
import { categoryName } from '../data/categories';
import { createDemoData } from '../data/demo-data';
import { FinanceStore, normalizeData } from '../data/finance-store';
import { FinanceSync } from '../data/finance-sync';
import { ChurchTax, RULES } from '../rules/rules';
import { downloadText } from '../shared/download';
import { formatDate } from '../shared/format';

const csvField = (value: string | number) => {
  const text = String(value);
  return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-profile',
  templateUrl: './profile.html',
})
export class Profile {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);
  private readonly document = inject(DOCUMENT);
  protected readonly auth = inject(Auth);
  protected readonly sync = inject(FinanceSync);

  protected readonly rulesAsOf = formatDate(RULES.asOf);
  protected readonly isEmpty = this.store.isEmpty;
  protected readonly counts = computed(() => {
    const data = this.store.data();
    return `${data.accounts.length} Konten, ${data.transactions.length} Buchungen, ${data.recurring.length} Einnahmen/Fixkosten, ${data.goals.length} Sparziele`;
  });

  protected readonly model = linkedSignal(() => {
    const p = this.store.data().profile;
    return { ...p, churchTax: String(p.churchTax) };
  });
  protected readonly profileForm = form(this.model, (s) => {
    min(s.children, 0, { message: 'Bitte 0 oder mehr eingeben.' });
    max(s.children, 20, { message: 'Bitte höchstens 20 eingeben.' });
  });
  protected readonly saved = signal(false);

  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly confirmDelete = signal(false);
  protected readonly confirmDemo = signal(false);

  protected saveProfile(): void {
    submit(this.profileForm, async () => {
      const value = this.model();
      this.store.updateProfile({
        name: value.name.trim(),
        street: value.street.trim(),
        city: value.city.trim(),
        jointAssessment: value.jointAssessment,
        churchTax: Number(value.churchTax) as ChurchTax,
        children: Math.max(0, Math.floor(value.children || 0)),
      });
      this.saved.set(true);
    });
  }

  protected exportBackup(): void {
    downloadText(
      this.document,
      `finanz-demo-sicherung-${this.clock.today()}.json`,
      JSON.stringify(this.store.data(), null, 2),
      'application/json',
    );
    this.notify('Sicherung wurde erstellt.');
  }

  protected exportCsv(): void {
    const data = this.store.data();
    const accounts = new Map(data.accounts.map((a) => [a.id, a.name]));
    const rows = [
      ['Datum', 'Konto', 'Empfänger/Auftraggeber', 'Verwendungszweck', 'Kategorie', 'Betrag'],
      ...[...data.transactions]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((tx) => [
          tx.date,
          accounts.get(tx.accountId) ?? '',
          tx.counterparty,
          tx.purpose,
          categoryName(tx.categoryId),
          tx.amount.toFixed(2).replace('.', ','),
        ]),
    ];
    // BOM so Excel opens the umlauts correctly.
    downloadText(
      this.document,
      `finanz-demo-buchungen-${this.clock.today()}.csv`,
      '﻿' + rows.map((row) => row.map(csvField).join(';')).join('\r\n'),
      'text/csv',
    );
    this.notify('CSV-Export wurde erstellt.');
  }

  protected async importBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const raw: unknown = JSON.parse(await file.text());
      if (!raw || typeof raw !== 'object' || (raw as { version?: unknown }).version !== 1) {
        throw new Error('Keine gültige Finanz-demo-Sicherung.');
      }
      this.store.replace({ ...normalizeData(raw), updatedAt: new Date().toISOString() });
      this.notify('Sicherung wurde wiederhergestellt.');
    } catch (error) {
      this.error.set(
        error instanceof Error && error.message.startsWith('Keine')
          ? error.message
          : 'Die Datei konnte nicht gelesen werden.',
      );
      this.message.set('');
    } finally {
      input.value = '';
    }
  }

  protected loadDemo(): void {
    if (!this.isEmpty() && !this.confirmDemo()) {
      this.confirmDemo.set(true);
      return;
    }
    this.store.replace(createDemoData(this.clock.today()));
    this.confirmDemo.set(false);
    this.notify('Beispieldaten wurden geladen.');
  }

  protected deleteAll(): void {
    if (!this.confirmDelete()) {
      this.confirmDelete.set(true);
      return;
    }
    this.store.clear();
    this.confirmDelete.set(false);
    this.notify('Alle Daten wurden gelöscht.');
  }

  private notify(text: string): void {
    this.message.set(text);
    this.error.set('');
  }
}

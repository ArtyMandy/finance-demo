import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { FinanceStore, ImportResult } from '../data/finance-store';
import { decodeCsv, ParsedBooking, parseIngCsv } from '../data/ing-csv';
import { Account } from '../data/models';
import { formatDateShort } from '../shared/format';

/** Imports the "Umsatzanzeige" CSV export of ING into a cash account. */
@Component({
  imports: [FormField],
  selector: 'app-csv-import',
  template: `
    <section class="card" aria-labelledby="import-heading">
      <h2 id="import-heading">ING-CSV importieren</h2>
      <p class="meta">
        Im ING-Banking unter „Umsätze“ → „Export“ die CSV-Datei herunterladen und hier auswählen.
        Bereits importierte Buchungen werden erkannt und übersprungen. Die Datei wird nur in deinem
        Browser gelesen.
      </p>
      @if (accounts().length) {
        <div class="form">
          <label class="field">
            Zielkonto
            <select [formField]="importForm.accountId">
              @for (account of accounts(); track account.id) {
                <option [value]="account.id">{{ account.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            CSV-Datei
            <input type="file" accept=".csv,text/csv" (change)="read($event)" />
          </label>
        </div>
      } @else {
        <p class="empty">Lege zuerst ein Girokonto, eine Kreditkarte oder ein Tagesgeldkonto an.</p>
      }

      <div aria-live="polite" class="stack">
        @for (error of errors(); track $index) {
          <p class="field-error">{{ error }}</p>
        }
        @if (bookings().length) {
          <p>
            <strong>{{ bookings().length }} Buchungen</strong> gefunden ({{ range() }}):
            {{ fresh() }} neu, {{ bookings().length - fresh() }} bereits vorhanden.
          </p>
          <div class="row">
            <button type="button" class="btn" [disabled]="!fresh()" (click)="import()">
              {{ fresh() }} Buchungen importieren
            </button>
            <button type="button" class="btn btn-secondary" (click)="reset()">Verwerfen</button>
          </div>
        }
        @if (result(); as r) {
          <p class="success">
            {{ r.added }} Buchungen importiert{{
              r.skipped ? ', ' + r.skipped + ' doppelte übersprungen' : ''
            }}. Die Kategorien wurden automatisch zugeordnet und lassen sich in der Liste
            korrigieren.
          </p>
        }
      </div>
    </section>
  `,
})
export class CsvImport {
  private readonly store = inject(FinanceStore);

  readonly accounts = input.required<readonly Account[]>();

  protected readonly model = linkedSignal(() => ({ accountId: this.accounts()[0]?.id ?? '' }));
  protected readonly importForm = form(this.model, (s) => required(s.accountId));

  protected readonly bookings = signal<ParsedBooking[]>([]);
  protected readonly errors = signal<string[]>([]);
  protected readonly result = signal<ImportResult | undefined>(undefined);

  private readonly accountId = computed(() => this.model().accountId);

  protected readonly fresh = computed(() => {
    const keys = this.store.existingImportKeys(this.accountId());
    this.store.data();
    return this.bookings().filter((booking) => !keys.has(booking.importKey)).length;
  });

  protected readonly range = computed(() => {
    const dates = this.bookings()
      .map((b) => b.date)
      .sort();
    return dates.length ? `${formatDateShort(dates[0])} – ${formatDateShort(dates.at(-1)!)}` : '';
  });

  protected async read(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.result.set(undefined);
    if (!file) return;
    const parsed = parseIngCsv(decodeCsv(await file.arrayBuffer()));
    this.bookings.set(parsed.bookings);
    this.errors.set(parsed.errors.slice(0, 5));
    if (!parsed.bookings.length && !parsed.errors.length)
      this.errors.set(['Die Datei enthält keine Buchungen.']);
  }

  protected import(): void {
    this.result.set(this.store.importBookings(this.accountId(), this.bookings()));
    this.bookings.set([]);
    this.errors.set([]);
  }

  protected reset(): void {
    this.bookings.set([]);
    this.errors.set([]);
  }
}
